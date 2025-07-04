// dweetme-scriptable
//
// Copyright (c) 2025 dweet.me
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
//
// Dweet.me iOS Scriptable Widget
// Fetches and displays a content key value from a dweet.me topic feed.
// A Scriptable widget can be placed on an iOS Home or Lock screen.
//
// INSTRUCTIONS:
// 1. Copy this entire script.
// 2. Open the Scriptable app on your iOS device.
// 3. Tap the '+' icon to create a new script.
// 4. Paste this code into the new script.
// 5. Tap the 'Run' button (▶) to test it.
// 6. To add it to your Home Screen (as of iOS 18):
//    - Go to Home Screen and add Scriptable widget, then tap Done.
//    - Long tap on widget & select 'Edit Widget'
//    - Set 'Script' to 'DweetStatus'.
//    - Set 'When Interacting' to 'Run Script'.
//    - Set Parameter to your [Dweet topic, key] or leave blank & set below here in app.
// 7. To add it to your Lock Screen (as of iOS 18):
//    - Go to 'Customize' Lock Screen (tap and hold on Lock Screen & tap 'Customize').
//    - Select the Lock Screen you want to customize.
//    - Tap on widget area to bring up 'Add Widgets'.
//    - Scroll down to Scriptable, select, & tap or drag to add widget.
//    - Tap the placed Scriptable widget.
//    - Set 'Script' to 'DweetStatus'.
//    - Set 'When Interacting' to 'Run Script'.
//    - Set Parameter to your [Dweet topic, key] or leave blank & set below here in app.
//
// EXAMPLE:
// Dweet was posted with:
// curl 'http://dweet.me:3333/publish/yoink/for/rotaryswitch8374?position=2'
// Set widget Parameter to 'rotaryswitch8374, position'.

const DWEET_TOPIC = "demoESP32"; // default value overridden by widget Parameter
const DWEET_KEY   = "status";    // default value overriden by widget Parameter
const DWEET_URL   = "http://dweet.me:3333/get/latest/yoink/from/"; // do not change

// If parameter input(s), override coded defaults
if (args.widgetParameter) {
  parms = args.widgetParameter.split(',').map(item => item.trim());
  dweetTopic = parms[0]; // 1st parameter
  dweetKey = DWEET_KEY;
  // check for a 2nd parameter (any past 2 are ignored)
  if (parms.length > 1) {
    dweetKey = parms[1];
  }
} else { // no parameters, so use coded defaults
  dweetTopic = DWEET_TOPIC;
  dweetKey = DWEET_KEY;
}

// Create the widget
async function createWidget() {
  // Color order: (light mode color, dark mode color)
  colorBackground = Color.dynamic(new Color("#2c2c2c"), Color.darkGray());
  colorTitle      = Color.dynamic(Color.white(),      Color.white());
  colorStatus     = Color.dynamic(Color.green(),      Color.green());
  colorErr        = Color.dynamic(Color.orange(),     Color.orange());
  colorBody       = Color.dynamic(Color.gray(),       Color.lightGray());
  colorFooter     = Color.dynamic(Color.gray(),       Color.lightGray());

  const widget = new ListWidget();
  widget.backgroundColor = colorBackground;

  try {
    // Create a title for the widget
    const titleText = widget.addText(dweetTopic + " : " + dweetKey.charAt(0).toUpperCase() + dweetKey.slice(1));
    titleText.textColor = colorTitle;
    titleText.font = Font.boldSystemFont(16);
    
    widget.addSpacer(10); // Add some space after the title

    // Fetch the latest Dweet
    const data = await fetchData(DWEET_URL + dweetTopic);
    console.log(data); // send received dweet to the console for debugging
    // Check if the data and content exist
    if (data.id && data.topic === dweetTopic) // check for successful fetch from Dweet server
    {
      const timestamp = new Date(data.timestamp);
      if (data.content[dweetKey])
      {
        const statusValue = data.content[dweetKey].toString();

      // Display the retrieved status value
      const statusText = widget.addText(statusValue);
      statusText.textColor = colorStatus;
      statusText.font = Font.heavySystemFont(28);
      statusText.centerAlignText();

      // Time-of-day
      const time = widget.addText(timestamp.toLocaleTimeString())
      time.textColor = colorBody;
      time.font = Font.regularSystemFont(16);
      time.centerAlignText();

      // Date
      const date = widget.addText(timestamp.toLocaleDateString())
      date.textColor = colorBody;
      date.font = Font.regularSystemFont(16);
      date.centerAlignText();

      } else {
        // dweetKey not found
        const statusText = widget.addText("No " + dweetKey + " found");
        statusText.textColor = colorErr;
        statusText.font = Font.mediumSystemFont(16);
        statusText.centerAlignText();
      }
    } else {
      // Topic not found (may be due to no updates within server keep period)
      const statusText = widget.addText("No '" + dweetTopic + "' topic found");
      statusText.textColor = colorErr;
      statusText.font = Font.mediumSystemFont(16);
      statusText.centerAlignText();
    }

  } catch (error) {
    // Handle errors during the fetch operation (e.g., network issues)
    console.error(`Error: ${error}`);
    const errorText = widget.addText("Error fetching Dweet");
    errorText.textColor = colorErr;
    errorText.font = Font.mediumSystemFont(14);
  }

  widget.addSpacer(); // Pushes the last updated text to the bottom

  // Add a "Last Updated" timestamp (when phone updated the widget)
  const now = new Date();
  const timeFormatter = new DateFormatter();
  timeFormatter.useShortTimeStyle();
  const lastUpdatedText = widget.addText(`Last updated: ${timeFormatter.string(now)}`);
  lastUpdatedText.textColor = colorFooter;
  lastUpdatedText.font = Font.footnote();
  lastUpdatedText.rightAlignText();

  return widget;
}

// Helper function to fetch and parse the JSON data
async function fetchData(url) {
  try {
    const request = new Request(url);
    const jsonResponse = await request.loadJSON();

    if (jsonResponse) {
      return jsonResponse;
    } else {
      console.log("Failed to get a successful response from dweet.me");
      return null;
    }
  } catch (e) {
    // Severe error that breaks widget
    throw new Error(`Could not retrieve Dweet. Details: ${e.message}`);
  }
}

// This section handles how the script is presented
if (config.runsInWidget) {
  // If running on the home screen, create the widget and set it
  let widget = await createWidget();
  Script.setWidget(widget);
} else {
  // If running inside the app, show a preview of the widget
  let widget = await createWidget();
  widget.presentMedium();
}

Script.complete();
