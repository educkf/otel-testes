import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { DocumentLoadInstrumentation } from '@opentelemetry/instrumentation-document-load';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { W3CTraceContextPropagator } from '@opentelemetry/core';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { trace, context, propagation, ROOT_CONTEXT } from '@opentelemetry/api';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { useFetch } from './useFetch'

var sessionContext = null;

export function initTelemetry() {
  const collectorOptions = {
    url: 'http://localhost:4318/v1/traces',
    headers: {}, // an optional object containing custom headers to be sent with each request
    concurrencyLimit: 10, // an optional limit on pending requests
  };

  // 1. Create a Tracer Provider
  const provider = new WebTracerProvider();

  // 2. Configure the Propagator (W3C Trace Context is standard)
  propagation.setGlobalPropagator(new W3CTraceContextPropagator());

  // 3. Configure the Collector Exporter
  const exporter = new OTLPTraceExporter(collectorOptions);

  // 4. Add the Exporter to the Tracer Provider
  provider.addSpanProcessor(new SimpleSpanProcessor(exporter));

  // 5. Register the Provider Globally
  provider.register();

  registerInstrumentations({
    instrumentations: [
      new DocumentLoadInstrumentation(),
    ],
  });

  // 6. Get a Tracer for Instrumentation
  const tracer = trace.getTracer('browser-tracer');

  // 7. Create a Parent Span
  // Start a session-specific trace
  const sessionSpan = tracer.startSpan('session-start', {}, ROOT_CONTEXT);
  const sessionTraceId = sessionSpan.spanContext().traceId;

  // Optionally log or store the trace_id for debugging
  console.log('Session trace_id:', sessionTraceId);

  // Save this context to use it across spans
  sessionContext = trace.setSpan(ROOT_CONTEXT, sessionSpan);
  sessionSpan.end();

}

export async function useFetchWithTelemetry(urls) {
  const tracer = trace.getTracer()
  const host = new URL(urls).host

  // get content and set a specific trace_id for the context to be used by the span
  const span = tracer.startSpan(`calling_fetch_for_${host}`, {}, sessionContext)

  const result = Array.isArray(urls)
    ? await Promise.all(urls.map(async (url) => {
      // aqui vira um recursivo, pq na hora que cria um 
      //`startActiveSpan` dentro do outro, ele encadeia com a chave`parent`
      return await useFetchWithTelemetry(url)
    }))
    : await useFetch(urls)

  span.setAttribute('hostUrl', host);
  span.setAttribute('fullUrl', urls);

  span.addEvent('some log', {
    'log.severity': 'error',
    'log.message': 'Data not found',
    'request.host': host,
  });

  span.end();

  const headers = {};
  propagation.inject(sessionContext, headers, {
    set: (carrier, key, value) => carrier[key] = value
  });

  return result?.data ? result.data : result;
}