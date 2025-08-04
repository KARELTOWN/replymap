let speed = 0
export const observer = new PerformanceObserver((list) => {
  list.getEntries().forEach((entry) => {
    if (entry.entryType === "resource") {
      const timeToFetch = entry.responseEnd - entry.fetchStart;
      if (timeToFetch > 0) {
        speed += timeToFetch / 1000
        console.log("entry", entry)
        console.log(`${entry.name}: Time to fetch: ${timeToFetch / 1000}s`);
      }
    }
  });
      console.log('speed page', speed)

});

