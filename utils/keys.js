export const getKeysIntegration = (integration) => {
  if (integration == "trello") {
    return {
      apiTrello: "2e6d5aa96409ba0011fe8dd7633e5822",
      secretTrello:
        "0e512fd9deef712e44f358f29c3ca8ed2c73413d46a864470739689e0bb2704f",
      returnURLTrello: `${process.env.FRONT_URL}/integration-finalize`,
      expirationTokenTrello: "30days",
      scopeTrello: "read,write",
      trelloReturnType: "token",
    };
  }
};

export const cryptKeys = {
  secretKey: "5d935a849407dcb366586d2eff725182d77cbff00b94d0a857f47631e2b921e6",
  refreshKey:
    "1ce17acedac88bdc86872b07a2d58adb47f78a0697dfef3f5788006f519961fa",
};

export const awsS3Keys = {
  AWS_ACCESS_KEY_ID: "AKIA5MSUBPGOATBVGJEW",
  AWS_SECRET_ACCESS_KEY: "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",
  AWS_DEFAULT_REGION: "eu-north-1",
  AWS_BUCKET: "asoweman-file-storage-compartiment",
  AWS_USE_PATH_STYLE_ENDPOINT: true,
  AWS_URL: "https://asoweman-file-storage-compartiment.s3.amazonaws.com/",
  AWS_URL_FILE:
    "https://asoweman-file-storage-compartiment.s3.eu-north-1.amazonaws.com/",
};

export const encryptKeys = {
  encrypted_key_hash:
    "fe681ee6cfd52c850298fac53b94ad57fe681ee6cfd52c850298fac53b94ad57",
  iv_key_hash: "f20e40e5684abae163c79662b8806a15",
};

export const elasticSearchKeys = {
  ELASTIC_URL:
    "https://0b6a0d33c64547549be8d9b4e6fd21fd.us-central1.gcp.cloud.es.io:443",
  ELASTIC_API_KEY:
    "NkQxVzhaY0JsakxaVDc0Wk1jT1o6bzA5T21EOF9MejJEUmxscjUzRE9rUQ==",
};
