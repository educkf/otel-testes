export async function useFetch(url) {

  return fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  }).then((response) => {
    if (!response.ok) {
      return false
    }
    return response.json();

  }).then((data) => {
    return data

  }).catch((error) => {
    console.error('There has been a problem with your fetch operation:', error);
    return error
  });
}