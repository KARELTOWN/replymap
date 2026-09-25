// Jobs are observed through `calls`, no BullMQ queue is opened.
export const calls = { feedback: [], integration: [], mailing: [], chunk: [] };
export const storeChunkJob = async (data) => calls.chunk.push(data);
export const storeFeedbackJob = async (data) => calls.feedback.push(data);
export const mailingJob = async (data) => calls.mailing.push(data);
