# DCL Exercise Tool

A tool for automatically populating Canvas courses with DataCamp Light exercises from GitHub repositories.

## Overview

The DCL Exercise Tool helps educators easily integrate DataCamp Light coding exercises into their Canvas LMS courses. The tool:

1. Takes a GitHub repository URL containing Python exercise files
2. Parses metadata from these files to determine their target Canvas pages and placement
3. Automatically updates the corresponding Canvas pages with embedded DataCamp Light exercises

## Features

- Simple web UI for configuring Canvas and GitHub integration
- Subdirectory selection from GitHub repositories
- Automatic parsing of Python exercise files with metadata blocks
- Canvas page updating with proper DataCamp Light embed codes
- Error handling with options to continue or abort processing
- Detailed reporting on the success or failure of each exercise update
- Local-first design that avoids CORS issues with the Canvas API

## Getting Started

### Requirements

- Node.js (v14 or later)
- NPM (v6 or later)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/dcl-exercise-tool.git

# Navigate into the project
cd dcl-exercise-tool

# Install dependencies
npm install

# Create an environment file from the example
cp .env.example .env

# Optional: Add a GitHub token to increase rate limits
# Edit the .env file and add your GitHub token

# Start both the frontend and backend servers
npm start
```

This will start the React frontend on port 3000 and the backend server on port 3001. The application will automatically open in your default browser.

### Canvas API Authentication

The tool requires a Canvas API key to interact with your Canvas instance. You can generate an API key from your Canvas account settings:

1. Log in to your Canvas instance
2. Go to Account > Settings
3. Scroll down to Approved Integrations
4. Click "+ New Access Token"
5. Enter a purpose and expiration date
6. Copy the generated token for use in the DCL Exercise Tool

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs both the frontend and backend servers concurrently.
- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend: [http://localhost:3001](http://localhost:3001)

### `npm run start:frontend`

Runs just the React frontend on port 3000.

### `npm run start:backend`
Runs just the Node.js backend on port 3001.

### `npm run build`

Builds the app for production to the `build` folder.
## Python Exercise File Format

Each Python exercise file must include a special `__metadata__` block at the top that specifies where the exercise should be placed in Canvas. The metadata uses standard Python dictionary syntax with quoted string keys:

```python
__metadata__ = {
    "course": "Your Course Name",
    "page": "page-url-slug",
    "placement": "datacamp"
}

# Your Python code here...
```
- `placement`: Value of the `data-code-placement` attribute in the target div on the Canvas page (required). Can be a single string or an array of strings for multiple placements.
- `course`: Optional field for administrative purposes, not used by the tool

### Multiple Placements

You can place the same exercise in multiple locations on a Canvas page by specifying an array of placement values:

```python
__metadata__ = {
    "page": "introduction-to-python",
    "placement": ["exercise1", "exercise2"]
}

# Your Python code here...
```

This will insert the DataCamp Light exercise into both placeholders with `data-code-placement="exercise1"` and `data-code-placement="exercise2"`.

## Canvas Page Format

The tool looks for elements with a specific `data-code-placement` attribute in the Canvas page HTML. The tool supports two types of placements:

### Interactive Placements (DataCamp Light)

Use a `<div>` element for interactive DataCamp Light exercises:

```html
<div data-code-placement="datacamp"></div>
```

The DataCamp Light exercise will be inserted into this div, allowing students to run and modify the code.

### Non-Interactive Placements (Raw Code Display)

Use a `<pre>` element for displaying raw code without interactivity:

```html
<pre data-code-placement="example"></pre>
```

The raw Python code (without the metadata block) will be inserted into this pre element for display purposes only.

#### Line Numbers and Custom Classes

When the "Include line numbers" option is enabled (default), non-interactive code blocks will be formatted with:
- The `line-numbers` class added to the `<pre>` element
- Code wrapped in a `<code class="language-python">` element

You can also add custom CSS classes to non-interactive code blocks by entering them in the "Custom CSS Classes" field (space-separated). These classes will be added to the `<pre>` element in addition to any other classes.

This follows Prism.js conventions for syntax highlighting with line numbers. The resulting HTML will look like:

```html
<pre class="line-numbers custom-code highlight-python" data-code-placement="example">
  <code class="language-python">
# Your Python code here
print("Hello, world!")
  </code>
</pre>
```

**Note:** You'll need to include Prism.js CSS and JavaScript in your Canvas theme for the line numbers and syntax highlighting to display correctly. Custom classes will only have an effect if you've defined corresponding CSS rules in your Canvas theme.

## Troubleshooting

### GitHub Rate Limiting

If you encounter GitHub API rate limiting errors, you can add your GitHub personal access token to the `.env` file:

```
GITHUB_TOKEN=your_token_here
```

This will increase your rate limit from 60 to 5000 requests per hour.

### Canvas API Issues

Make sure your Canvas API key has the necessary permissions to read and update pages in the course you're targeting.

## Future Enhancements

- Support for private GitHub repositories
- Desktop application using Electron
- Support for other LMS platforms beyond Canvas

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
