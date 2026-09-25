// This file used to hold, in clear and committed, the Trello API key and
// secret, the storage credentials, the token signing keys and the Elastic key.
// Values now come from the environment, whose encrypted version is the only
// one committed (see scripts/secrets.js).
//
// The `cryptKeys`, `awsS3Keys`, `encryptKeys` and `elasticSearchKeys` exports
// are gone: they duplicated environment variables already read directly by the
// modules concerned, and nobody imported them.

const required = (name) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Variable d'environnement manquante : ${name}. ` +
        `Lancez « npm run secrets -- check <env> » pour vérifier le coffre.`
    );
  }
  return value;
};

export const getKeysIntegration = (integration) => {
  if (integration === "trello") {
    return {
      apiTrello: required("TRELLO_API_KEY"),
      secretTrello: required("TRELLO_SECRET"),
      returnURLTrello: `${required("FRONT_URL")}/integration-finalize`,
      expirationTokenTrello: "30days",
      scopeTrello: "read,write",
      trelloReturnType: "token",
    };
  }
  return null;
};
