import ListIntegration from "../models/ListIntegration.js";

async function ListIntegrationSeeder() {
  try {
    const data = [
      {
        libelle: "Trello",
        logo: `<svg width="64px" height="64px" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M25.0133 4H7.0019C5.344 4 4 5.34315 4 7V25C4 26.6569 5.344 28 7.0019 28H25.0133C26.6653 27.9916 28 26.6509 28 25V7C28 5.34907 26.6653 4.00838 25.0133 4ZM9 7H13C14.1046 7 15 7.89543 15 9V23C15 24.1046 14.1046 25 13 25H9C7.89543 25 7 24.1046 7 23V9C7 7.89543 7.89543 7 9 7ZM23 7H19C17.8954 7 17 7.89543 17 9V16C17 17.1046 17.8954 18 19 18H23C24.1046 18 25 17.1046 25 16V9C25 7.89543 24.1046 7 23 7Z" fill="url(#paint0_linear_87_7663)"></path> <defs> <linearGradient id="paint0_linear_87_7663" x1="16.0076" y1="28" x2="16.0076" y2="4" gradientUnits="userSpaceOnUse"> <stop stop-color="#0052CC"></stop> <stop offset="0.51698" stop-color="#217EF8"></stop> <stop offset="1" stop-color="#2684FF"></stop> </linearGradient> </defs> </g></svg>`,
      },
      {
        libelle: "Jira",
        logo: `<svg width="64px" height="64px" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M29.6647 15.2165L17.2075 3.1679L16 2L6.62269 11.0697L2.33526 15.2165C1.88825 15.6494 1.88825 16.3506 2.33526 16.7835L10.9025 25.0697L16 30L25.3773 20.9303L25.5225 20.7899L29.6647 16.7835C30.1118 16.3506 30.1118 15.6494 29.6647 15.2165ZM16 20.1394L11.7202 16L16 11.8606L20.2798 16L16 20.1394Z" fill="#2684FF"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M15.9999 11.8606C13.1979 9.15007 13.1842 4.75994 15.9694 2.0332L6.60352 11.0881L11.701 16.0184L15.9999 11.8606Z" fill="url(#paint0_linear_87_7658)"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M20.2912 15.9888L16 20.1392C17.3525 21.4466 18.1124 23.2202 18.1124 25.0695C18.1124 26.9189 17.3525 28.6925 16 29.9999L25.3888 20.9191L20.2912 15.9888Z" fill="url(#paint1_linear_87_7658)"></path> <defs> <linearGradient id="paint0_linear_87_7658" x1="15.2357" y1="7.67312" x2="8.09646" y2="10.7902" gradientUnits="userSpaceOnUse"> <stop offset="0.18" stop-color="#0052CC"></stop> <stop offset="1" stop-color="#2684FF"></stop> </linearGradient> <linearGradient id="paint1_linear_87_7658" x1="16.8177" y1="24.2786" x2="23.9441" y2="21.1836" gradientUnits="userSpaceOnUse"> <stop offset="0.18" stop-color="#0052CC"></stop> <stop offset="1" stop-color="#2684FF"></stop> </linearGradient> </defs> </g></svg>`,
      },
      {
        libelle: "ClickUp",
        logo: `<svg fill="#000000" width="64px" height="64px" viewBox="0 0 24 24" role="img" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="m2 18.439 3.69-2.828c1.961 2.56 4.044 3.739 6.363 3.739 2.307 0 4.33-1.166 6.203-3.704L22 18.405C19.298 22.065 15.941 24 12.053 24 8.178 24 4.788 22.078 2 18.439zM12.04 6.15l-6.568 5.66-3.036-3.52L12.055 0l9.543 8.296-3.05 3.509z"></path></g></svg>`,
      },
    ];

    await ListIntegration.insertMany(data);
    console.log("List integration insérés");
  } catch (error) {
    throw error;
  }
}
export default ListIntegrationSeeder;
