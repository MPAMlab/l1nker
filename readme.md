# L1nker

L1nker is a one-page promotional page for MPAM Laboratory internal use, but also can be deployed on your own server.

## Introduction

L1nker is a lightweight web application that allows you to quickly create a personal link page, similar to Linktree or other profile-style landing pages. It is designed to be easy to configure and deploy, making it ideal for showcasing your social media profiles, projects, or other important links.

## Features

- **Customizable Links:** Add and customize links with text, URLs, background colors, and icons.
- **Dynamic Data Loading:** Fetch page data (profile image, title, subtitle, links) from an API.
- **Responsive Design:** Works well on various screen sizes.

## Technologies Used

-   **Vue.js(w/ vite):** The core framework for building the user interface.
-   **Cloudflare Pages** The frontend
-   **Cloudflare Worker** Backend
-   **Cloudflare D1 & R2** Database(sqlite) + Static media

## Getting Started

### Prerequisites

-   [Node.js](https://nodejs.org/) (>=16)
-   [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
-   [Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/)

### Installation (under construction)

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/MPAMlab/l1nker
    cd l1nker/
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    # or
    yarn install
    ```

### Building for Production(under construction)

#### Vite

1.  **Build the application:**

    ```bash
    npm run build
    # or
    yarn build
    ```

2.  Deploy the contents of the `\l1nker-web` folder to your web server.

#### Cloudflare worker

1. Clone this repo
2. Modify the wrangler.toml to your actual binding
3. Deploy the contens of the `\l1nker-server` folder to your worker 

## Configuration

-   **Data Fetching:** Update the API endpoint in `HomePage.vue` to fetch your data.
-   **API Data Format:** The API should return a JSON object with the following structure:

    ```json
    {
        "profileImageUrl": "url-to-profile-image",
        "title": "Your Title",
        "subtitle": "Your Subtitle",
        "buttons": [
          {
            "text": "Button 1",
            "link": "https://example.com/1",
            "backgroundColor": "#3498db",
            "isDownload": false
          },
          {
            "text": "Button 2",
            "link": "https://example.com/2",
            "backgroundColor": "#2ecc71",
            "isDownload": true
         }
        ],
      "faviconUrl": "url-to-favicon",
      "pageTitle": "Your Page Title"
    }
    ```

-   **Customization:** Modify the styles and layouts in the CSS files (`HomePage.vue` and `LinkButton.vue`).

## Components

- **HomePage.vue:** The main component that displays the profile information, links and footer.
- **LinkButton.vue:** A reusable component for rendering each link button.
- **AdminPage.vue:**
- **ItemForm.vue:**
- **LoginPage.vue**

## License

[MIT](LICENSE)
