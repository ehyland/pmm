import http from "node:http";
import https from "node:https";

async function request(url: string, options?: https.RequestOptions) {
  return await new Promise<http.IncomingMessage>((resolve, reject) => {
    const agent = url.startsWith("https") ? https : http;
    const request = agent.request(
      url,
      {
        method: "GET",
        ...options,
      },
      (res) => {
        res.statusCode;
      }
    );
    request.end();
    request.on("response", (res) => {
      resolve(res);
    });
    request.on("error", (error) => {
      reject(error);
    });
  });
}

export async function stream(url: string) {
  const response = await request(url);

  if (response.statusCode !== 200) {
    throw new Error(`http status code ${response.statusCode} for \n\t${url}`);
  }

  return response;
}

export async function json<T = any>(url: string): Promise<T> {
  const response = await request(url);

  if (response.statusCode !== 200) {
    throw new Error(`http status code ${response.statusCode} for \n\t${url}`);
  }

  if (!response.headers["content-type"]?.match(/json/i)) {
    throw new Error(
      `expected json in response, found ${response.headers["content-type"]}`
    );
  }

  const data: T = await new Promise((resolve) => {
    let jsonString = "";
    response.setEncoding("utf-8").on("data", (chunk) => (jsonString += chunk));
    response.on("end", () => {
      resolve(JSON.parse(jsonString));
    });
  });

  return data;
}
