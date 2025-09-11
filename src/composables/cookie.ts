export default function setCookie(libelle, user_id) {
  let cookie = document.cookie.split('; ').find((item) => item.startsWith(`${libelle}=`))
  if (!cookie) {
    let date = new Date()
    date.setTime(date.getTime() + 1000 * 60 * 60 * 24 * 365)
    document.cookie = `${libelle}=${user_id}; expires=${date.toUTCString()}; SameSite=None; Secure`
  }
  return true
}