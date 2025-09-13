export const mainCSS = `
#bugreveal_capture-refreshBoardList {
display: block;
background: #465FFF;
color: white;
margin-top: 5px;
}


#bugreveal_capture-integration {
display: block;
}

  #replay_map_record_video {
  height: 100%;
  width: 100%;
  }

  #bugreveal_recordPanel {
  display: none;
  z-index: 99999999;
  position: fixed;
  bottom: 10px;
  width: 15%;
  left: 45%;
  margin: auto;
  justify-content: space-around;
  background-color: white;
  padding: 10px 30px;
   border: 1px solid #ddd;
      border-radius: 8px;
      box-shadow: 0 15px 20px rgba(0,0,0,0.2);
  }
  #bugreveal_btnRecordResume {
  display:none;
  }

    #bugreveal_recordPanel button {
      padding: 3px;
      width: auto;
      cursor: pointer;
      border: none;
      border-radius: 6px;
      color: white;      
    }

    #bugreveal_recordPanel button svg {
    width: 37px;
    height: 37px;
    }

    #bugreveal_recordPanel button:hover {
  transform: translateY(-1px);
}


    #bugreveal_capture-panel {
      display: flex;
      justify-content: start;
          align-self: anchor-center;
      position: fixed;
      top: 10px;
      right: 0px;
      background: #f3f3f3;
      max-width: 100%;
      max-height: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 8px;
      box-shadow: 0 15px 20px rgba(0,0,0,0.2);
      z-index: 9999999 !important;
    }

    #bugreveal_canvas-loader {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgb(0 0 0 / 80%);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

#bugreveal_#canvas-loader .bugreveal_spinner {
  border: 6px solid #ccc;
  border-top: 6px solid #007bff;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
      position: absolute;
    top: 45%;
    right: 45%;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}


     #bugreveal_editmodezone {
  position: sticky;
  top: 0;
  z-index: 1000;
  display: flex;
  justify-content: center;
  gap: 12px;
  padding: 12px 20px;
  margin-bottom: 10px;
  background: #ffffff;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border-radius: 0 0 12px 12px;
  transition: all 0.3s ease;
}
  


    #bugreveal_editmodezone button {
  background-color: #465FFF; /* Bleu principal */
  color: white;
  border: none;
  padding: 8px 14px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.2s ease;
}

bugreveal_editmodezone button:hover {
  background-color: #2e4de0;
  transform: translateY(-1px);
}

#bugreveal_editmodezone button:active {
  transform: scale(0.98);
}


    #bugreveal_button-zone {
    justify-content: center;
    flex-flow: column;
    display: flex;
    padding: 7px;
    }
    
    #bugreveal_capture-panel button {
      display: block;
      padding: 3px;
      width: auto;
      cursor: pointer;
      border: none;
      border-radius: 6px;
      color: white;      
    }

    #bugreveal_capture-panel button svg {
    width: 30px;
    height: 30px;
    }

    #bugreveal_capture-preview {
      margin-top: 10px;
      margin-bottom: 20px;
      overflow: auto;
      position: relative;
      width: 75%;
      
    }
    #bugreveal_capture-preview canvas {
      border: 1px solid #ccc;
      cursor: crosshair;
      display: block;
      width: 100%;
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      box-shadow: 0 15px 20px rgba(0,0,0,0.2);
    }
    #bugreveal_capture-desc, #bugreveal_capture-title, #bugreveal_capture-feedbackType, #bugreveal_capture-feedbackPriority, #bugreveal_capture-attachment, #bugreveal_capture-feedbackAssignTo {
      margin-top: 10px;
      width: 100%;
      padding: 8px;
      border-radius: 6px;
      border: 1px solid #ddd;
      display: block;
    }
   
      #bugreveal_errorZone {
      padding: 10px;
      background: #FF4646;
      color: white;
      overflow-x: auto;
      }


.bugreveal_left-panel {
  width: 25%;
  display: none;
  flex-direction: column;
  gap: 15px;
  margin: 0 15px;
  padding: 20px;
  background-color: #ffffff;
  border-radius: 16px;
  box-shadow: 0 20px 30px rgba(0, 0, 0, 0.15);
  overflow-y: auto;
  max-height: 100%;
  transition: all 0.3s ease;
}

/* 🧾 Inputs, selects, textarea */
.bugreveal_left-panel input,
.bugreveal_left-panel select,
.bugreveal_left-panel textarea {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid #ccc;
  border-radius: 8px;
  background-color: #f9f9f9;
  font-size: 14px;
  color: #333;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.bugreveal_left-panel input:focus,
.bugreveal_left-panel select:focus,
.bugreveal_left-panel textarea:focus {
  border-color: #465FFF;
  box-shadow: 0 0 0 3px rgba(70, 95, 255, 0.2);
  outline: none;
}

/* 🧵 Textarea spécifique */
.bugreveal_left-panel textarea {
  resize: vertical;
  min-height: 80px;
}

 #bugreveal_capture-send {
      margin-top: 10px;
      background: #465FFF;
      width: 65% !important;
      margin: 0 auto;
       border: none;
  padding: 8px 0px !important;
  border-radius: 8px;
  font-weight: 600;
  transition: background-color 0.3s ease, transform 0.2s ease;
    }


#bugreveal_capture-send:hover {
  background-color: #2e4de0;
  transform: translateY(-1px);
}

/* 🏷️ Labels (si présents) */
.bugreveal_left-panel label {
  font-weight: 500;
  margin-bottom: 6px;
  display: block;
  color: #444;
}

.bugreveal_selection-box {
  position: absolute;
  border: 2px dashed red;
  background: rgba(255, 0, 0, 0.5);
  z-index: 999999;
}

.bugreveal_writezone {
  position: absolute;
  width: 120px;
  padding: 6px 10px;
  font-size: 16px;
  font-family: 'Segoe UI', Arial, sans-serif;
  color: #333;
  background-color: rgba(255, 255, 255, 0.95);
  border: 1px solid #ccc;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 999999;
  transition: all 0.3s ease;
}
.bugreveal_writezone:focus {
  border-color: #465FFF;
  box-shadow: 0 0 0 3px rgba(70, 95, 255, 0.2);
  outline: none;
}


.bugreveal_custom-notification {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 15px 25px;
  border-radius: 8px;
  box-shadow: 0 10px 15px rgba(0, 0, 0, 0.2);
  z-index: 999999999;
  font-family: Arial, sans-serif;
  font-size: 16px;
}

/* Type-specific styles */
.bugreveal_custom-notification-error {
  background: #FF4646;
  color: white;
}

.bugreveal_custom-notification-success {
  background: #46FF7D;
  color: black;
}

.bugreveal_custom-notification-info {
  background: #46C8FF;
  color: black;
}

#bugreveal_capture_connexion {
text-align: center;
color: black !important;
}

`;

export const buttonzoneHTML = `
    <button id="bugreveal_btnScreen" title="Capturer l'écran">
    <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.0" id="Layer_1" width="800px" height="800px" viewBox="0 0 64 64" enable-background="new 0 0 64 64" xml:space="preserve">
        <g>
            <path fill="#231F20" d="M32,48c6.627,0,12-5.373,12-12s-5.373-12-12-12s-12,5.373-12,12S25.373,48,32,48z M32,28   c4.418,0,8,3.582,8,8c0,0.553-0.447,1-1,1s-1-0.447-1-1c0-3.313-2.687-6-6-6c-0.553,0-1-0.447-1-1S31.447,28,32,28z"/>
            <path fill="#231F20" d="M32,52c8.837,0,16-7.162,16-16c0-8.837-7.163-16-16-16s-16,7.163-16,16C16,44.838,23.163,52,32,52z M32,22   c7.732,0,14,6.268,14,14s-6.268,14-14,14s-14-6.268-14-14S24.268,22,32,22z"/>
            <circle fill="#231F20" cx="55" cy="21" r="1"/>
            <path fill="#231F20" d="M60,12c0,0-7,0-8,0s-1.582,0.004-2.793-1.207s-5.538-5.538-5.538-5.538C43.481,5.067,42.33,4,41,4   S24.453,4,23,4s-2.498,1.084-2.686,1.271c0,0-4.326,4.326-5.521,5.521S13.018,12,12,12V9c0-0.553-0.447-1-1-1H5   C4.447,8,4,8.447,4,9v3c-2.211,0-4,1.789-4,4v12h15.893C18.84,22.078,24.937,18,32,18s13.16,4.078,16.107,10H64V16   C64,13.789,62.211,12,60,12z M10,12c-1.24,0-2.782,0-4,0v-2h4V12z M55,24c-1.657,0-3-1.344-3-3s1.343-3,3-3s3,1.344,3,3   S56.657,24,55,24z"/>
            <path fill="#231F20" d="M50,36c0,9.941-8.059,18-18,18s-18-8.059-18-18c0-2.107,0.381-4.121,1.046-6H0v26c0,2.211,1.789,4,4,4h56   c2.211,0,4-1.789,4-4V30H48.954C49.619,31.879,50,33.893,50,36z"/>
        </g>
    </svg>
</button>
    <button id="bugreveal_btnCropScreen" title="Capturer une zone">
        <svg class="btnElement" xmlns="http://www.w3.org/2000/svg" width="800px" height="800px" viewBox="0 0 48 48" fill="none">
            <path d="M16 6H8C6.89543 6 6 6.89543 6 8V16" stroke="#000000" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M16 42H8C6.89543 42 6 41.1046 6 40V32" stroke="#000000" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M32 42H40C41.1046 42 42 41.1046 42 40V32" stroke="#000000" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M32 6H40C41.1046 6 42 6.89543 42 8V16" stroke="#000000" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
            <rect x="14" y="14" width="20" height="20" rx="2" fill="#2F88FF" stroke="#000000" stroke-width="4"/>
        </svg>
    </button>
     <button id="bugreveal_btnRecordVideoAudio" title="Enregistrer l'écran">
        <svg viewBox="0 0 1024 1024" class="icon" version="1.1" xmlns="http://www.w3.org/2000/svg" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M759.3 352h84.3c15.5 0 28.1 9.2 28.1 20.5v277.3c0 11.3-12.6 20.5-28.1 20.5h-70.3" fill="#8CAAFF"></path><path d="M843.5 695h-70.2v-49.5h70.2c1.4 0 2.5-0.2 3.3-0.4v-268c-0.9-0.2-2-0.4-3.3-0.4h-84.2v-49.5h84.3c29.6 0 52.8 19.9 52.8 45.3v277.3c0 25.4-23.3 45.2-52.9 45.2z" fill="#333333"></path><path d="M203.5 258h531c13.7 0 24.7 11.1 24.7 24.7v457.8c0 13.7-11.1 24.7-24.7 24.7h-531c-13.7 0-24.7-11.1-24.7-24.7V282.7c-0.1-13.6 11-24.7 24.7-24.7z" fill="#FFFFFF"></path><path d="M734.5 790h-531c-27.3 0-49.5-22.2-49.5-49.5V282.7c0-27.3 22.2-49.5 49.5-49.5h531c27.3 0 49.5 22.2 49.5 49.5v457.8c0 27.3-22.2 49.5-49.5 49.5z m-531-507.3v457.8h531V282.7h-531z" fill="#333333"></path><path d="M595.8 521.2L407 656c-5.6 4-13.3 2.7-17.3-2.9-1.5-2.1-2.3-4.6-2.3-7.2V376.3c0-6.8 5.5-12.4 12.4-12.4 2.6 0 5.1 0.8 7.2 2.3L595.8 501c5.6 4 6.9 11.7 2.9 17.3-0.8 1.1-1.8 2.1-2.9 2.9z" fill="#8CAAFF"></path><path d="M399.9 683c-2.1 0-4.1-0.2-6.2-0.5-9.8-1.6-18.4-7-24.1-15.1-4.5-6.3-6.9-13.8-6.9-21.6V376.3c0-20.5 16.6-37.1 37.1-37.1 7.8 0 15.2 2.4 21.6 6.9l188.8 134.8c8.1 5.8 13.4 14.3 15 24.1 1.6 9.8-0.6 19.6-6.4 27.7-2.4 3.4-5.3 6.3-8.7 8.7L421.3 676.2c-6.3 4.5-13.8 6.8-21.4 6.8z m12.2-282.6v221.5l155.1-110.7-155.1-110.8zM581.4 501s0 0.1 0 0z" fill="#333333"></path></g></svg>
    </button>
  `;

export const recordPanelHTML = `
    <button id="bugreveal_btnRecordPause">
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22ZM8.07612 8.61732C8 8.80109 8 9.03406 8 9.5V14.5C8 14.9659 8 15.1989 8.07612 15.3827C8.17761 15.6277 8.37229 15.8224 8.61732 15.9239C8.80109 16 9.03406 16 9.5 16C9.96594 16 10.1989 16 10.3827 15.9239C10.6277 15.8224 10.8224 15.6277 10.9239 15.3827C11 15.1989 11 14.9659 11 14.5V9.5C11 9.03406 11 8.80109 10.9239 8.61732C10.8224 8.37229 10.6277 8.17761 10.3827 8.07612C10.1989 8 9.96594 8 9.5 8C9.03406 8 8.80109 8 8.61732 8.07612C8.37229 8.17761 8.17761 8.37229 8.07612 8.61732ZM13.0761 8.61732C13 8.80109 13 9.03406 13 9.5V14.5C13 14.9659 13 15.1989 13.0761 15.3827C13.1776 15.6277 13.3723 15.8224 13.6173 15.9239C13.8011 16 14.0341 16 14.5 16C14.9659 16 15.1989 16 15.3827 15.9239C15.6277 15.8224 15.8224 15.6277 15.9239 15.3827C16 15.1989 16 14.9659 16 14.5V9.5C16 9.03406 16 8.80109 15.9239 8.61732C15.8224 8.37229 15.6277 8.17761 15.3827 8.07612C15.1989 8 14.9659 8 14.5 8C14.0341 8 13.8011 8 13.6173 8.07612C13.3723 8.17761 13.1776 8.37229 13.0761 8.61732Z" fill="#465FFF"></path> </g></svg>
</button>
 <button id="bugreveal_btnRecordResume">
    <svg fill="#465FFF" viewBox="-2 0 32 32" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid" stroke="#465FFF"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M26.530,31.994 C26.222,31.994 25.915,31.903 25.619,31.722 L2.000,17.205 L2.000,31.000 C2.000,31.553 1.552,32.000 1.000,32.000 C0.448,32.000 -0.000,31.553 -0.000,31.000 L-0.000,1.006 C-0.000,0.453 0.448,0.006 1.000,0.006 C1.552,0.006 2.000,0.453 2.000,1.006 L2.000,13.855 L25.628,0.248 C25.917,0.083 26.211,-0.000 26.507,-0.000 C27.372,-0.000 28.000,0.689 28.000,1.639 L28.000,30.367 C28.000,31.435 27.260,31.994 26.530,31.994 ZM3.097,15.531 L26.000,29.608 L26.000,2.341 L3.097,15.531 Z"></path> </g></svg>
</button>
    <button id="bugreveal_btnRecordStop">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#465FFF"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22ZM8.58579 8.58579C8 9.17157 8 10.1144 8 12C8 13.8856 8 14.8284 8.58579 15.4142C9.17157 16 10.1144 16 12 16C13.8856 16 14.8284 16 15.4142 15.4142C16 14.8284 16 13.8856 16 12C16 10.1144 16 9.17157 15.4142 8.58579C14.8284 8 13.8856 8 12 8C10.1144 8 9.17157 8 8.58579 8.58579Z" fill="#465FFF"></path> </g></svg>
    </button>
  `;

export const spinnerHTML = `<svg class="loader" viewBox="0 0 50 50" width="50" height="50">
  <circle
    cx="25"
    cy="25"
    r="20"
    fill="none"
    stroke="#465FFF"
    stroke-width="4"
    stroke-linecap="round"
    stroke-dasharray="100"
    stroke-dashoffset="60"
  >
    <animateTransform
      attributeName="transform"
      type="rotate"
      from="0 25 25"
      to="360 25 25"
      dur="1s"
      repeatCount="indefinite"
    />
  </circle>
</svg>
`;
