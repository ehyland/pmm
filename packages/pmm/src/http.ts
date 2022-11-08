import fetch from 'node-fetch';

export async function stream(url: string) {
  const response = await fetch(url);

  if (response.status !== 200) {
    throw new Error(`http status code ${response.status} for \n\t${url}`);
  }

  return response;
}

export async function json<T = any>(url: string): Promise<T> {
  const response = await fetch(url);

  if (response.status !== 200) {
    throw new Error(`http status code ${response.status} for \n\t${url}`);
  }

  const data = await response.json();

  return data as T;
}
