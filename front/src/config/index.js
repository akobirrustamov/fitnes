import axios from "axios";
export let baseUrl;
baseUrl = "http://localhost:8080";
// baseUrl = "";

// Shared refresh promise — prevents concurrent refresh races when Promise.all
// triggers multiple simultaneous 401s with the same refresh token.
let refreshPromise = null;

export default function ApiCall(url, method, data, param) {
  let token = localStorage.getItem("access_token");
  const authHeader = token ? `Bearer ${token}` : undefined;
  return axios({
    url: baseUrl + url,
    method: method,
    data: data,
    headers: { Authorization: authHeader },
    params: param,
  })
    .then((res) => {
      return { error: false, data: res.data };
    })
    .catch((err) => {
      const status = err.response?.status;
      if (status === 401) {
        const refreshToken = localStorage.getItem("refresh_token");
        if (!refreshToken) {
          return { error: true, data: status };
        }
        if (!refreshPromise) {
          refreshPromise = axios({
            url: baseUrl + `/api/v1/auth/refresh?refreshToken=${refreshToken}`,
            method: "POST",
          })
            .then((res) => {
              // Refresh endpoint returns {accessToken, refreshToken, expiresIn}
              const newAccess = res.data?.accessToken ?? res.data;
              localStorage.setItem("access_token", newAccess);
              if (res.data?.refreshToken) {
                localStorage.setItem("refresh_token", res.data.refreshToken);
              }
            })
            .finally(() => {
              refreshPromise = null;
            });
        }
        return refreshPromise
          .then(() => {
            return axios({
              url: baseUrl + url,
              method: method,
              data: data,
              headers: {
                Authorization: `Bearer ${localStorage.getItem("access_token")}`,
              },
              params: param,
            });
          })
          .then((res) => ({ error: false, data: res.data }))
          .catch((err) => ({ error: true, data: err.response?.data }));
      }
      return { error: true, data: err.response?.data };
    });
}
