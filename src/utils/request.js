import { bugRevealToken } from "./cookie";

export const fetchPostMember = (path, body) => {
  return fetch(`${import.meta.env.VITE_BACKEND_URL}/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json;charset=utf-8",
      Authorization: `Bearer ${bugRevealToken}`,
    },
    body: JSON.stringify(body),
  });
};

export const fetchPost = (path, body) => {
  return fetch(`${import.meta.env.VITE_BACKEND_URL}/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
};

export const fetchGetMember = (path, body) => {
  return fetch(`${import.meta.env.VITE_BACKEND_URL}/${path}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${bugRevealToken}`,
    },
    body: JSON.stringify(body),
  });
};

export const fetchGet = (path) => {
  return fetch(`${import.meta.env.VITE_BACKEND_URL}/${path}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
};

export const fetchPostWithFile = (path, body) => {
  return fetch(`${import.meta.env.VITE_BACKEND_URL}/${path}`, {
    method: "POST",
    body: body,
  });
};

export const fetchPostWithFileForMember = (path, body) => {
  return fetch(`${import.meta.env.VITE_BACKEND_URL}/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${bugRevealToken}`,
    },
    body: body,
  });
};
