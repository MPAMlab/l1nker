# L1nker

L1nker is a one-page promotional page for MPAM Laboratory internal use, but also can be deployed on your own server.

## Introduction

L1nker is a lightweight web application that allows you to quickly create a personal link page, similar to Link\*\*ee, Link\*\*re or other profile-style landing pages. It is designed to be easy to configure and deploy, making it ideal for showcasing your social media profiles, projects, or other important links.

## Features

- **Customizable Links:** Add and customize links with text, URLs, background colors, and icons.
- **Dynamic Data Loading:** Fetch page data (profile image, title, subtitle, links) from an API.
- **Responsive Design:** Works well on various screen sizes.

## To-do

### before version 1.0

- Rearrangeable list
- User Management
- Ability to use 2FA / SSO
- Homepage for sp.srt.pub, 404 (http code) pages, redirectKey not in database will redirect to Homepage 
- More components: Artist page or card / Podcast page / Event page / Music page and Album page
- More customization
- Social buttons

### version > 1.0 roadmap:

- (probably 1.5 or not) Pre-release countdown
- (probably 1.5) Video support(Thumbnail & Embed youtube or bilibili or nicovideo)
- (probably 1.5) Custom background and gif support
- (probably 2.0) Click statistic analyze & Export
- (probably 2.0) Reward program & Coupon code
- (probably 2.5) Workspace and Team support
- (not planned) Merch embed
- (not planned) Integration / API
- (not planned) Ads
- (not planned) Territory management
- (not planned) Pop-up campaign


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
3. Deploy the contents of the `\l1nker-server` folder to your worker 

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

## Future plan of this project

This project is only for internal projects' showcase, and we are happy to provide our build of this tool to people we're associated with, this tool will not becoming a commercial project in the forseeable future(as there're some commercial tools can do better jobs), nor becoming a SAAS service. If you need, you can build your own version upon this based on GNU license.

## License

This repository is using [GNU GPLv3 License](LICENSE), this permits the ``commercial use, distribution, modification, patent use and private use`` of this repository, with condition of ``disclose source, license and copyright notice, same license, state changes``. This repository don't cover for ``liability and warranty``. More legal information, please checkout the [LICENSE](LICENSE).
