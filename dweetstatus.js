// dweet.me iOS Scriptable Widget
// Fetches and displays a "status" value from a dweet.me feed.
//
// INSTRUCTIONS:
// 1. Copy this entire script.
// 2. Open the Scriptable app on your iOS device.
// 3. Tap the '+' icon to create a new script.
// 4. Paste this code into the new script.
// 5. Tap the 'Run' button (▶) to test it.
// 6. To add it to your Home Screen:
//    - Go to Home Screen and add Scriptable widget, then tap Done.
//    - Long tap on widget & select 'Edit Widget'
//    - Set 'Script' to 'DweetStatus'.
//    - Set 'When Interacting' to 'Run Script'.
//    - Set Parameter to [Dweet topic, key] or set below here in app
//
// EXAMPLE:
// dweet was posted with:
// curl 'http://dweet.me:3333/publish/yoink/for/rotaryswitch8374?position=2'
// set widget Parameter to 'rotaryswitch8374, position'

const DWEET_TOPIC = "demoESP32"; // default value overridden by widget Parameter
const DWEET_KEY = "status"; // default value overriden by widget Parameter
const DWEET_URL = "http://dweet.me:3333/get/latest/yoink/from/";

// If parameter input(s), override coded defaults
if (args.widgetParameter) {
  parms = args.widgetParameter.split(',').map(item => item.trim());
  dweet_topic = parms[0]; // 1st parameter
  dweet_key = DWEET_KEY;
  // check for a 2nd parameter (any past 2 are ignored)
  if (parms.length > 1) {
    dweet_key = parms[1];
  }
} else { // no parameters, so use coded defaults
  dweet_topic = DWEET_TOPIC;
  dweet_key = DWEET_KEY;
}

// Create the widget
async function createWidget() {
  const widget = new ListWidget();
  widget.backgroundColor = Color.dynamic(new Color("#2c2c2c"), Color.darkGray())

  try {
    // Create a title for the widget
    const titleText = widget.addText(dweet_topic + " : " + dweet_key.charAt(0).toUpperCase() + dweet_key.slice(1));
    titleText.textColor = Color.white();
    titleText.font = Font.boldSystemFont(16);
    
    widget.addSpacer(10); // Add some space after the title

    // Fetch data from the URL
    const data = await fetchData(DWEET_URL + dweet_topic);
    console.log(data); // send received dweet to the console for debugging
    // Check if the data and content exist
    if (data && data.content)
    {
      const timestamp = new Date(data.timestamp);
      if (data.content[dweet_key])
      {
        const statusValue = data.content[dweet_key];

      // Display the retrieved status value
      const statusText = widget.addText(statusValue);
      statusText.textColor = Color.green();
      statusText.font = Font.heavySystemFont(28);
      statusText.centerAlignText();

      // Time-of-day
      const time = widget.addText(timestamp.toLocaleTimeString())
      time.textColor = Color.dynamic(Color.gray(), Color.lightGray())
      time.font = Font.regularSystemFont(16);
      time.centerAlignText();

      // Date
      const date = widget.addText(timestamp.toLocaleDateString())
      date.textColor = Color.dynamic(Color.gray(), Color.lightGray());
      date.font = Font.regularSystemFont(16);
      date.centerAlignText();

      } else {
        // if no dweet available or malformed dweet
        const statusText = widget.addText("no " + dweet_key);
        statusText.textColor = Color.red();
        statusText.font = Font.mediumSystemFont(20);
        statusText.centerAlignText();
      }

    } else {
      // Handle cases where the expected data is not found
      const errorText = widget.addText("Data format incorrect");
      errorText.textColor = Color.orange();
      errorText.font = Font.mediumSystemFont(14);
    }
  } catch (error) {
    // Handle errors during the fetch operation (e.g., network issues)
    console.error(`Error: ${error}`);
    const errorText = widget.addText("Error fetching status");
    errorText.textColor = Color.red();
    errorText.font = Font.mediumSystemFont(14);
  }

  widget.addSpacer(); // Pushes the last updated text to the bottom

  // Add a "Last Updated" timestamp (when phone updated the widget)
  const now = new Date();
  const timeFormatter = new DateFormatter();
  timeFormatter.useShortTimeStyle();
  const lastUpdatedText = widget.addText(`Last updated: ${timeFormatter.string(now)}`);
  lastUpdatedText.textColor = Color.dynamic(Color.gray(), Color.lightGray());
  lastUpdatedText.font = Font.footnote();
  lastUpdatedText.rightAlignText();

  return widget;
}

// Helper function to fetch and parse the JSON data
async function fetchData(url) {
  try {
    const request = new Request(url);
    const jsonResponse = await request.loadJSON();

    if (jsonResponse && jsonResponse.id > 0) {
      return jsonResponse;
    } else {
      console.log("Failed to get a successful response from dweet.me");
      return null;
    }
  } catch (e) {
    // Rethrow the error to be caught by the main function
    throw new Error(`Could not load data from URL. Details: ${e.message}`);
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
