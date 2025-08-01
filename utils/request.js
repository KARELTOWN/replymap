export const fetchPost = (path, body) => {
  return fetch(`${import.meta.env.VITE_BACKEND_URL}/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
};

export const fetchGet = (path) => {
  return fetch(`${import.meta.env.VITE_BACKEND_URL}/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
};
