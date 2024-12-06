
import { initTelemetry, useFetchWithTelemetry } from './initTelemetry'
import { useFetch } from './useFetch'
// import { useFetchWithTelemetry } from './useFetchWithTelemetry';

initTelemetry()

const prepareClickEvent = async () => {
  const elements = document.getElementsByClassName('button');

  for (const element of elements) {
    const url = element.getAttribute('data-url');
    const shouldUseTelemetry = element.getAttribute('data-telemetry') === 'true';
    element.addEventListener('click', () => fetchOnClick(url, shouldUseTelemetry));
  }
}

window.addEventListener('load', prepareClickEvent);

async function fetchOnClick(url, shouldUseTelemetry) {
  const result_pre = document.getElementById('result');
  result_pre.innerHTML = 'Loading...';

  const urls = url.split('||');

  var data;

  if (urls.length === 0) {
    return
  }

  if (urls.length > 1) {
    data = shouldUseTelemetry
      ? await fetchArrayhWithTelemetry(urls)
      : await fetchArray(urls);
  } else {
    data = shouldUseTelemetry
      ? await useFetchWithTelemetry(urls[0])
      : await useFetch(urls[0]);
  }

  if (data) {
    result_pre.innerHTML = JSON.stringify(data, null, 2);
  }
}

async function fetchArray(urls) {
  const data = new Promise.all(urls.map(async (url) => {
    return await useFetch(url);
  }));
  return data.map(item => JSON.stringify(item, null, 2)).join('\n\n');
}

async function fetchArrayhWithTelemetry(urls) {
  const data = await useFetchWithTelemetry(urls);
  return data.map(item => JSON.stringify(item, null, 2)).join('\n\n');
}
