import { trace, context } from '@opentelemetry/api'
import { useFetch } from './useFetch'

export async function useFetchWithTelemetry(urls) {
  const tracer = trace.getTracer()    
  const host = new URL(urls).host

  // get content and set a specific trace_id for the context to be used by the span


  return tracer.startActiveSpan(`calling_fetch_for_${host}`, async (parentSpan) => {
    const output = {}

    const spanContext = trace.getSpanContext(context);

    const result = Array.isArray(urls)
      ? await Promise.all(urls.map(async (url) => {
          // aqui vira um recursivo, pq na hora que cria um 
          //`startActiveSpan` dentro do outro, ele encadeia com a chave`parent`
          return await useFetchWithTelemetry(url) 
        }))
      : await useFetch(urls)

    parentSpan.setAttribute('hostUrl', host);
    parentSpan.setAttribute('fullUrl', urls);

    parentSpan.addEvent('some log', {
      'log.severity': 'error',
      'log.message': 'Data not found',
      'request.host': host,
    });

    parentSpan.end();
    return result?.data ? result.data : result;
  })
}