self.onmessage = async (e) => {
  const { param, action } = e.data;

  async function storeRecordChunk() {
    try {
      const result = await fetch(`${param.url}`, {
        method: param.method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(param.payload),
      });
      if (result.ok) {
        const response = await result.json();
        self.postMessage({ type: "done", data: response });
      } else {
        const response = await result.json();
        self.postMessage({ type: "error", error: response.message });
      }
    } catch (err) {
      self.postMessage({ type: "error", error: err.message });
    }
  }

  if (action == "storeChunk") {
    await storeRecordChunk();
  } else {
    self.postMessage({ type: "error", action, error: "Unknown action" });
  }
};
