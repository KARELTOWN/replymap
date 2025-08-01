// export const observer = new PerformanceObserver((list) => {
//   list.getEntries().forEach((entry) => {
//     if (entry.entryType === "resource") {
//       const timeToFetch = entry.responseEnd - entry.fetchStart;
//       if (timeToFetch > 0) {
//         console.log(`${entry.name}: Time to fetch: ${timeToFetch / 1000}s`);
//       }
//     }
//   });
// });

// observer.observe({ type: "resource", buffered: true });
