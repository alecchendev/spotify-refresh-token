import React, { useState, useEffect, useRef } from 'react';
import QueryString from 'query-string';
import axios from 'axios';
import { CopyToClipboard } from 'react-copy-to-clipboard';

const getAccessToken = (refreshToken, clientId, clientSecret) => axios.post(
  'https://accounts.spotify.com/api/token',
  QueryString.stringify({
    code: refreshToken,
    redirect_uri: 'http://127.0.0.1:5173/callback',
    grant_type: 'authorization_code',
  }),
  {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${new Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
  },
);

const callbackUri = `${window.location.href.split('/').slice(0, 3).join('/')}/callback`;

function App() {
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [scope, setScope] = useState('');

  const [scopes, setScopes] = useState({
    'ugc-image-upload': false,
    'user-read-recently-played': false,
    'user-top-read': false,
    'user-read-playback-position': false,
    'user-read-playback-state': false,
    'user-modify-playback-state': false,
    'user-read-currently-playing': false,
    'app-remote-control': false,
    'playlist-modify-public': false,
    'playlist-modify-private': false,
    'playlist-read-private': false,
    'playlist-read-collaborative': false,
    'user-follow-modify': false,
    'user-follow-read': false,
    'user-library-modify': false,
    'user-library-read': false,
    'user-read-email': false,
    'user-read-private': false,
    streaming: false,
  });

  const [refreshToken, setRefreshToken] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [saveRefreshToken, setSaveRefreshToken] = useState(true);
  const [saveClientCredentials, setSaveClientCredentials] = useState(false);

  const [outputs, setOutputs] = useState({
    filled: false,
    data: {},
  });

  /**
   * Sets the refresh token if it is in the URL
   * Also gets the local storage values for the client credentials and scope
   */
  useEffect(() => {
    const storedSettings = JSON.parse(localStorage.getItem('settings'));
    if (storedSettings) {
      setSaveRefreshToken(storedSettings.saveRefreshToken);
      setSaveClientCredentials(storedSettings.saveClientCredentials);
    }

    const clientIdStored = localStorage.getItem('clientId');
    if (clientIdStored) {
      setClientId(clientIdStored);
    }
    const clientSecretStored = localStorage.getItem('clientSecret');
    if (clientSecretStored) {
      setClientSecret(clientSecretStored);
    }

    // these needed to be cleared if the user does not want to save them
    if (storedSettings && !storedSettings.saveClientCredentials) {
      localStorage.removeItem('clientId');
      localStorage.removeItem('clientSecret');
    }

    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('code');
    const storedToken = localStorage.getItem('refreshToken');

    if (token) {
      setRefreshToken(token);
      if (saveRefreshToken) {
        localStorage.setItem('refreshToken', token);
      }
    } else if (saveRefreshToken) {
      setRefreshToken(storedToken || '');
    }

    const locallyStoredScope = localStorage.getItem('scope');
    if (locallyStoredScope) {
      setScopes(JSON.parse(locallyStoredScope));
    }
  }, []);

  /**
   * Gets the access token if the refresh token is set
   */
  useEffect(() => {
    if (refreshToken.length > 0 && clientId.length > 0 && clientSecret.length > 0) {
      getAccessToken(refreshToken, clientId, clientSecret).then((response) => {
        setAccessToken(response.data.access_token);
      }).catch((error) => {
        console.error(error);
      });
    }
  }, [refreshToken]);

  /**
   * Gets the data from the Spotify API if the access token is set
   * TODO: refactor
   */
  useEffect(() => {
    if (accessToken.length > 0) {
      axios({
        method: 'get',
        url: 'https://api.spotify.com/v1/me',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        json: true,
      }).then((response) => {
        setOutputs({
          filled: true,
          data: response.data,
        });
      }).catch((error) => {
        console.error(error);
      });
    }
  }, [accessToken]);

  /**
   * Sets the scopes to their set values
   */
  useEffect(() => {
    const newScope = Object.keys(scopes).filter((singleScope) => scopes[singleScope]).join(' ');
    setScope(newScope);
  }, [scopes]);

  /**
   * Allows the following "useEffect" to run only on updates
   */
  const isInitialMount = useRef(true);

  /**
   * Sets the settings to save credentials/tokens to local storage
   */
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
    } else {
      localStorage.setItem('settings', JSON.stringify({ saveClientCredentials, saveRefreshToken }));
    }
  }, [saveRefreshToken, saveClientCredentials]);

  /**
   * Removes the refresh token from local storage if the user doesn't want to save it
   */
  const handleSaveRefreshTokenChange = () => {
    if (!saveRefreshToken) {
      localStorage.removeItem('refreshToken');
    }
    setSaveRefreshToken(!saveRefreshToken);
  };

  /**
   * Removes the client credentials from local storage if the user doesn't want to save them
   */
  const handleSaveClientCredentialsChange = () => {
    if (!saveClientCredentials) {
      localStorage.removeItem('clientId');
      localStorage.removeItem('clientSecret');
    }
    setSaveClientCredentials(!saveClientCredentials);
  };

  /**
   * Handles the client id/secret change
   * @param {React.MouseEventHandler<HTMLInputElement>} event
   */
  const clientIdChange = (event) => {
    setClientId(event.target.value);
  };
  const clientSecretChange = (event) => {
    setClientSecret(event.target.value);
  };

  /**
   * Handles the scope checkbox change
   * @param {string} name
   */
  const handleCheck = (name) => {
    const newScopes = { ...scopes };
    newScopes[name] = !scopes[name];
    setScopes(newScopes);
    localStorage.setItem('scope', JSON.stringify(newScopes));
  };

  // sets the "select all" checkbox to true if all scopes are selected
  const allSelected = Object.keys(scopes).every((singleScope) => scopes[singleScope]);

  /**
   * handles the "select all" checkbox change
   * @param {boolean} selectAll
   */
  const handleSelectAll = (selectAll) => {
    const newScopes = Object.keys(scopes).reduce((acc, singleScope) => {
      acc[singleScope] = selectAll;
      return acc;
    }, {});
    localStorage.setItem('scope', JSON.stringify(newScopes));

    setScopes(newScopes);
  };

  /**
   * Handles the submit button click, which will redirect the user to the Spotify login page
   */
  const handleSubmit = () => {
    /**
     * Save the client credentials to local storage,
     * if the user has decided not to save them, on the next page load they will be cleared
     * This can be a security risk if the user never comes back to the page, with some error
     * however, this should not be used for anything other than testing and development
     */
    localStorage.setItem('clientId', clientId);
    localStorage.setItem('clientSecret', clientSecret);

    /** we include the clientId and the clientSecret in the
     *  redirect uri to avoid having to store them in the browser */
    const redirectURI = encodeURIComponent(window.location.href.split('/').slice(0, 4).join('/'));
    const queryString = `https://accounts.spotify.com/authorize?response_type=code&client_id=${clientId}&scope=${encodeURIComponent(scope)}&redirect_uri=${redirectURI}`;
    window.location.replace(queryString);
  };

  return (
    <div className="flex h-screen text-white m-5">
      <div className="m-auto md:w-2/3 max-w-[1024px] grid grid-cols-1 gap-3">
        <div className="flex-1 text-4xl bg-slate-700 rounded-xl p-5 text-center underline">
          Get your spotify refresh token!
        </div>
        <div className="flex-1 text-xl bg-red-500 rounded-xl p-5 text-center underline">
          Warning, this is not a secure way to get your refresh token! For the love of god and all that is holy, do not use this with your production keys!
          <br />
          For increased security, look over the code, run this locally and don&#39;t enable the save credentials option.
        </div>
        {accessToken.length > 0 && (
          <div className="flex-1 bg-slate-700 rounded-xl p-5 text-center">
            <div className="text-2xl underline">Access Token (lasts 1 hour)</div>
            <input type="text" readOnly value={accessToken} className="w-3/4 text-black m-2 p-1" />
            <div className="flex justify-center">
              <CopyToClipboard text={accessToken}>
                <div className="cursor-pointer bg-slate-600 w-3/4 rounded-xl text-xl p-2 m-1">Copy to clipboard</div>
              </CopyToClipboard>
            </div>

          </div>
        )}
        {refreshToken.length > 0 && (
          <div className="flex-1 bg-slate-700 rounded-xl p-5 text-center">
            <div className="text-2xl underline">Refresh Token</div>
            <input type="text" readOnly value={refreshToken} className="w-3/4 text-black m-2 p-1" />
            <div className="flex justify-center">
              <CopyToClipboard text={refreshToken}>
                <div className="cursor-pointer bg-slate-600 w-3/4 rounded-xl text-xl p-2 m-1">Copy to clipboard</div>
              </CopyToClipboard>
            </div>

          </div>
        )}
        {outputs.filled && (
          <div className="flex-1 bg-slate-700 rounded-xl p-5 text-center">
            <div className="text-2xl underline">Example Output</div>
            <textarea className="w-3/4 text-sm text-black m-2 p-1 h-64" readOnly value={JSON.stringify(outputs.data, null, 2)} />
          </div>
        )}
        {refreshToken.length === 0 && ( // only show the reminder if the user hasn't gotten the refresh token yet
        <div className="grid md:grid-cols-2 grid-cols-1 gap-2">
          <a href="https://developer.spotify.com/dashboard/applications" target="_blank" rel="noreferrer" className="flex-1 bg-slate-700 rounded-xl p-5 text-center hover:bg-slate-600">
            <div className="text-2xl underline">Click here to go to the developer dashboard</div>
          </a>
          <CopyToClipboard text={callbackUri}>
            <div className="flex-1 bg-slate-700 rounded-xl p-5 text-center cursor-pointer hover:bg-slate-600">
              Remember to add
              {` ${callbackUri} `}
              as a redirect uri in your app. Click this box to copy it to your clipboard.
            </div>
          </CopyToClipboard>
        </div>
        )}

        <div className="bg-slate-700 rounded-xl p-5 text-center grid grid-cols-1 gap-3">
          <div className="grid grid-cols-1 gap-2">
            <div className="bg-slate-600 rounded-xl p-3 text-center flex align-middle">
              <div className="flex-1 m-auto">Client Id</div>
              <input
                className="flex-initial bg-slate-300 text-black p-1"
                type="text"
                name="clientId"
                value={clientId}
                onChange={clientIdChange}
              />
            </div>
            <div className="bg-slate-600 rounded-xl p-3 text-center flex align-middle">
              <div className="flex-1 m-auto">Client Secret</div>
              <input
                className="flex-initial bg-slate-300 text-black p-1"
                type="text"
                name="clientSecret"
                value={clientSecret}
                onChange={clientSecretChange}
              />
            </div>
          </div>

          <div className="text-3xl underline m-3">
            Scope
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            {Object.keys(scopes).map((singleScope) => (
              <button type="button" key={singleScope} className="p-2 flex bg-slate-600 hover:bg-slate-500 cursor-pointer align-middle" onClick={() => handleCheck(singleScope)}>
                <input
                  type="checkbox"
                  className="flex-initial cursor-pointer m-auto"
                  id={singleScope}
                  onChange={() => {}}
                  checked={scopes[singleScope]}
                />
                <div className="flex-1 cursor-pointer">{singleScope}</div>
              </button>

            ))}
          </div>

          <button type="button" className="p-2 flex bg-slate-600 hover:bg-slate-500 cursor-pointer align-middle" onClick={() => handleSelectAll(!allSelected)}>
            <input
              type="checkbox"
              className="flex-initial cursor-pointer m-auto"
              onChange={() => {}}
              checked={allSelected}
            />
            <div className="flex-1 cursor-pointer">Select all</div>
          </button>

          <div className="text-3xl underline m-3">
            Save credentials
          </div>
          <div className="grid grid-cols-2 gap-2 select-none">
            <button type="button" className="bg-slate-600 hover:bg-slate-500 cursor-pointer p-2 flex align-middle" onClick={() => handleSaveClientCredentialsChange()}>
              <input type="checkbox" checked={saveClientCredentials} className="m-auto" onChange={() => {}} />
              <div className="flex-1 cursor-pointer">Save Client Id/Secret</div>
            </button>
            <button type="button" className="bg-slate-600 hover:bg-slate-500 cursor-pointer p-2 flex align-middle" onClick={() => handleSaveRefreshTokenChange()}>
              <input type="checkbox" checked={saveRefreshToken} className="m-auto" onChange={() => {}} />
              <div className="flex-1 cursor-pointer">Save Refresh Token</div>
            </button>
          </div>
        </div>

        <button type="submit" className="bg-slate-700 hover:bg-slate-600 p-2 rounded-xl mb-5" onClick={handleSubmit}>
          Submit
        </button>

      </div>

    </div>
  );
}

export default App;
