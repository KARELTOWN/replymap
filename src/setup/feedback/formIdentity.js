// Identity of a visitor with no BugReveal account.
//
// On a project whose owner opened guest feedback, the email typed here is the
// whole identity of the report: there is no account behind it. It is asked for
// plainly rather than collected silently, and it is the only required field of
// the two — a name is a courtesy, an email is what lets the team answer.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_MAX_LENGTH = 80;
const STORAGE_KEY = "bugreveal_guest_identity";

// Remembered on this browser only, so a second report does not mean typing the
// same address again. Nothing is sent anywhere until a feedback is submitted.
const remembered = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
};

const remember = (identity) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
  } catch {
    // Private browsing refuses to store: not worth failing a submission over.
  }
};

export function createGuestIdentityFields({ makeField, fields }) {
  const known = remembered();

  const email = document.createElement("input");
  email.id = "bugreveal_guest-email";
  email.type = "email";
  email.autocomplete = "email";
  email.placeholder = "vous@exemple.com";
  email.value = known.email || "";

  const emailField = makeField({
    label: "Votre email",
    control: email,
    id: email.id,
    required: true,
    hint: "Pour vous répondre et vous tenir au courant. Il n'est pas rendu public.",
  });
  fields.register("guest_email", emailField.error, email);

  const name = document.createElement("input");
  name.id = "bugreveal_guest-name";
  name.type = "text";
  name.autocomplete = "name";
  name.maxLength = NAME_MAX_LENGTH;
  name.placeholder = "Prénom ou pseudo";
  name.value = known.name || "";

  const nameField = makeField({
    label: "Votre nom",
    control: name,
    id: name.id,
    hint: "Facultatif.",
  });
  fields.register("guest_name", nameField.error, name);

  email.addEventListener("input", () => {
    if (EMAIL_PATTERN.test(email.value.trim())) fields.setFieldError("guest_email", null);
  });

  const validate = () => {
    const value = email.value.trim();
    if (!value) {
      fields.setFieldError("guest_email", "Indiquez votre email pour envoyer ce retour");
      return false;
    }
    if (!EMAIL_PATTERN.test(value)) {
      fields.setFieldError("guest_email", "Cet email ne semble pas valide");
      return false;
    }
    return true;
  };

  const read = () => {
    const identity = { guest_email: email.value.trim(), guest_name: name.value.trim() };
    remember({ email: identity.guest_email, name: identity.guest_name });
    return identity;
  };

  return { validate, read, emailInput: email };
}
