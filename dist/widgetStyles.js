// Stylesheet of the embedded widget, injected as one <style> element.
//
// It is written by hand rather than built by Vite: the widget is loaded on a
// customer's site through a plain <script>, without the HTML pipeline that
// normally links a stylesheet to a dynamic import.

import { shellCSS } from "./styles/shellStyles.js";
import { panelCSS } from "./styles/panelStyles.js";
import { formCSS } from "./styles/formStyles.js";

export const mainCSS = [shellCSS, panelCSS, formCSS].join("\n\n");
