import countries from 'world-countries'

const countryCoords = countries.map((c) => ({
  name: c.name.common,
  coords: [c.latlng[0], c.latlng[1]],
}))

export const getCountryCoords = (countryName) => {
  return countryCoords.find((e) => e.name === countryName)
}

export const getManyCountryCoords = (countryNames) => {
  let allCountryCoords = []
  countryNames.forEach((name) => {
    let oneCountryCoords = countryCoords.find((e) => e.name === name)
    if (oneCountryCoords && oneCountryCoords !== undefined) {
      allCountryCoords.push(oneCountryCoords)
    }
  })
  return allCountryCoords
}
