# spotify-refresh-token
A simple site for developers to easily get their own refresh token / access token for Spotify's API.

Unlike the original repo, this fork does not contact some random heroku server with your credentials. 
It's all done as locally as possible, with only github being the people who can see your refresh token
and potentially youir clientID/clientSecret, unless it's ran locally.

# How to run

Clone the repo

	yarn

	yarn run dev

# How to deploy to GH pages

change the homepage to your github pages url in package.json

change the 'base' in vite.config.js to your github repo name

	yarn run deploy