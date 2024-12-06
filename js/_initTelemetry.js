import { context, trace } from '@opentelemetry/api';
import { ConsoleSpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { WebTracerProvider, BatchSpanProcessor } from '@opentelemetry/sdk-trace-web';
import { DocumentLoadInstrumentation } from '@opentelemetry/instrumentation-document-load';
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch';
import { ZoneContextManager } from '@opentelemetry/context-zone';
import { registerInstrumentations } from '@opentelemetry/instrumentation';

export async function initTelemetry() {
  const collectorOptions = {
    url: 'http:"//localhost:4318/v1/traces',
    headers: {}, // an optional object containing custom headers to be sent with each request
    concurrencyLimit: 10, // an optional limit on pending requests
  };

  const exporter = new OTLPTraceExporter(collectorOptions);
  // const exporter = new ConsoleSpanExporter();

  const provider = new WebTracerProvider({
    spanProcessors: [
      // new BatchSpanProcessor(exporter, {
      //   maxQueueSize: 100, // The maximum queue size. After the size is reached spans are dropped.
      //   maxExportBatchSize: 10, // The maximum batch size of every export. It must be smaller or equal to maxQueueSize.
      //   scheduledDelayMillis: 500, // The interval between two consecutive exports
      //   exportTimeoutMillis: 30000, // How long the export can run before it is cancelled
      // })
      new SimpleSpanProcessor(new ConsoleSpanExporter())
    ]
  });
  provider.addSpanProcessor(
    new SimpleSpanProcessor(exporter)
  );

  provider.register({
    // Changing default contextManager to use ZoneContextManager - supports asynchronous operations - optional
    contextManager: new ZoneContextManager(),
  });

  // Registering instrumentations
  registerInstrumentations({
    instrumentations: [
      new DocumentLoadInstrumentation(),
      // new FetchInstrumentation({
      //   ignoreUrls: [/httpbin.org\/get/],
      //   propagateTraceHeaderCorsUrls: [new RegExp("http://localhost:4318")]
      // }),
    ],
  });
}