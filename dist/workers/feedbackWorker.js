// Sends the feedback off the main thread: the capture may weigh several MB
// and the customer's site must not freeze during the upload.
self.onmessage = async (e) => {
  const { param, action } = e.data;

  if (action !== "storeFeedback") {
    self.postMessage({
      type: "error",
      action,
      message: "Unknown action",
      requestId: param?.requestId,
    });
    return;
  }

  const fd = new FormData();
  for (const key in param.payload) {
    fd.append(key, param.payload[key]);
  }
  for (const file of param.attachments || []) {
    fd.append("attachments", file);
  }

  try {
    // A member sends their token; a guest, on a project that opened itself to
    // visitors without an account, sends none. An empty `Bearer` header used to
    // be sent in that case, which the API reads as a malformed session and
    // refuses before the guest guard is ever reached.
    const result = await fetch(param.url, {
      method: param.method,
      headers: param.token ? { Authorization: `Bearer ${param.token}` } : {},
      body: fd,
    });

    const response = await result.json().catch(() => ({}));

    if (result.ok) {
      self.postMessage({
        type: "done",
        data: response,
        requestId: param.requestId,
      });
      return;
    }

    // The API is moving to a single envelope: failures answer
    // `{ success: false, error: { code, message, details } }`. Routes not yet
    // migrated still answer `{ message, errors: [{ msg }] }`. Both are read
    // here; drop the legacy branch once the migration is complete.
    const message = response?.error?.message || response?.message;
    const details =
      response?.error?.details?.map((detail) => detail.message) ||
      response?.errors?.map((error) => error.msg);

    if (result.status === 422 && details?.length) {
      self.postMessage({
        type: "error",
        message,
        errors: details,
        requestId: param.requestId,
      });
      return;
    }

    self.postMessage({
      type: "error",
      status: result.status,
      code: response?.error?.code,
      message,
      requestId: param.requestId,
    });
  } catch (err) {
    self.postMessage({
      type: "error",
      message: err.message,
      requestId: param.requestId,
    });
  }
};
