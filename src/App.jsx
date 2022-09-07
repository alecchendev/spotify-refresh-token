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

  function getHashParams() {
    const hashParams = {};
    let e; const r = /([^&;=]+)=?([^&;]*)/g;
    const q = window.location.hash.substring(1);
    while (e = r.exec(q)) {
      hashParams[e[1]] = decodeURIComponent(e[2]);
    }
    return hashParams;
  }

  /**
   * Sets the refresh token if it is in the URL
   * Also gets the local storage values for the client credentials and scope
   */
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('code');
    if (token) {
      setRefreshToken(token);
    }
    console.log(`Got refresh token: ${token}`);
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

    console.log(`Got client credentials from local storage, set to: ${clientIdStored}, ${clientSecretStored}`);

    const locallyStoredScope = localStorage.getItem('scope');
    if (locallyStoredScope) {
      setScopes(JSON.parse(locallyStoredScope));
    }
  }, []);

  /**
   * Gets the access token if the refresh token is set
   */
  useEffect(() => {
    if (refreshToken.length > 0) {
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
    const callApi = async (params) => {
      let data = {};
      try {
        const response = await axios({
          method: 'get',
          url: 'https://api.spotify.com/v1/me',
          headers: {
            Authorization: `Bearer ${params.access_token}`,
          },
          json: true,
        });
        data = response.data;
      } catch (err) {
        console.error(err);
      }

      setOutputs({
        ...outputs,
        filled: true,
        accessToken: params.access_token,
        refreshToken: params.refresh_token,
        data,
      });
    };

    const params = getHashParams();

    if (params.access_token && params.refresh_token) {
      callApi(params);
    }
  }, []);

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
      console.log(`storedSettings set to: ${JSON.stringify({ saveClientCredentials, saveRefreshToken })}`);
    }
  }, [saveRefreshToken, saveClientCredentials]);

  /**
   * Removes the refresh token from local storage if the user doesn't want to save it
   */
  const handleSaveRefreshTokenChange = () => {
    setSaveRefreshToken(!saveRefreshToken);
    if (!saveRefreshToken) {
      localStorage.removeItem('refreshToken');
    }
  };

  /**
   * Removes the client credentials from local storage if the user doesn't want to save them
   */
  const handleSaveClientCredentialsChange = () => {
    setSaveClientCredentials(!saveClientCredentials);
    if (!saveClientCredentials) {
      localStorage.removeItem('clientId');
      localStorage.removeItem('clientSecret');
    }
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
    console.log(`Set scope to ${JSON.stringify(newScopes)}`);
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
    console.log(`Set scope to ${JSON.stringify(newScopes)}`);

    setScopes(newScopes);
  };

  /**
   * Handles the submit button click, which will redirect the user to the Spotify login page
   */
  const handleSubmit = () => {
    if (saveClientCredentials) {
      localStorage.setItem('clientId', clientId);
      localStorage.setItem('clientSecret', clientSecret);
    }

    /** we include the clientId and the clientSecret in the
     *  redirect uri to avoid having to store them in the browser */
    const redirectURI = encodeURIComponent(window.location.href.split('/').slice(0, 3).join('/').concat('/callback'));
    const state = encodeURIComponent(`${clientId}:${clientSecret}`);
    const queryString = `https://accounts.spotify.com/authorize?response_type=code&client_id=${clientId}&scope=${encodeURIComponent(scope)}&redirect_uri=${redirectURI}&state=${state}`;
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
            <div className="text-2xl underline">Access Token</div>
            <input type="text" value={accessToken} className="w-2/3 text-black m-2 p-1" />
            <div className="flex justify-center">
              <CopyToClipboard text={accessToken}>
                <div className="cursor-pointer bg-slate-600 w-2/3 rounded-xl text-xl p-2 m-1">Copy to clipboard</div>
              </CopyToClipboard>
            </div>

          </div>
        )}
        {refreshToken.length > 0 && (
          <div className="flex-1 bg-slate-700 rounded-xl p-5 text-center">
            <div className="text-2xl underline">Refresh Token</div>
            <input type="text" value={refreshToken} className="w-2/3 text-black m-2 p-1" />
            <div className="flex justify-center">
              <CopyToClipboard text={refreshToken}>
                <div className="cursor-pointer bg-slate-600 w-2/3 rounded-xl text-xl p-2 m-1">Copy to clipboard</div>
              </CopyToClipboard>
            </div>

          </div>
        )}
        <div className="flex-1 bg-slate-700 rounded-xl p-5 text-center">
          Remember to add
          {` ${window.location.href.split('/').slice(0, 3).join('/')}/callback `}
          as a redirect uri in your app.
        </div>

        <div className="bg-slate-700 rounded-xl p-5 text-center grid grid-cols-1 gap-3">
          <div className="grid grid-cols-1 gap-2">
            <div className="bg-slate-600 rounded-xl p-3 text-center flex">
              <div className="flex-1">Client Id</div>
              <input
                className="flex-initial bg-slate-300 text-black p-1"
                type="text"
                name="clientId"
                value={clientId}
                onChange={clientIdChange}
              />
            </div>
            <div className="bg-slate-600 rounded-xl p-3 text-center flex">
              <div className="flex-1">Client Secret</div>
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
              <button type="button" key={singleScope} className="p-2 flex bg-slate-600 cursor-pointer align-middle" onClick={() => handleCheck(singleScope)}>
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

          <button type="button" className="p-2 flex bg-slate-600 cursor-pointer" onClick={() => handleSelectAll(!allSelected)}>
            <input
              type="checkbox"
              className="flex-initial cursor-pointer"
              onChange={() => {}}
              checked={allSelected}
            />
            <div className="flex-1 cursor-pointer">Select all</div>
          </button>

          <div className="text-3xl underline m-3">
            Save credentials
          </div>
          <div className="grid grid-cols-2 gap-2 select-none">
            <button type="button" className="bg-slate-600 cursor-pointer p-2 flex align-middle" onClick={() => handleSaveClientCredentialsChange()}>
              <input type="checkbox" checked={saveClientCredentials} className="m-auto" onChange={() => {}} />
              <div className="flex-1 cursor-pointer">Save Client Id/Secret</div>
            </button>
            <button type="button" className="bg-slate-600 cursor-pointer p-2 flex align-middle" onClick={() => handleSaveRefreshTokenChange()}>
              <input type="checkbox" checked={saveRefreshToken} className="m-auto" onChange={() => {}} />
              <div className="flex-1 cursor-pointer">Save Refresh Token</div>
            </button>
          </div>
        </div>

        <button type="submit" className="bg-slate-600 p-2 rounded-xl mb-5" onClick={handleSubmit}>
          Submit
        </button>

      </div>

    </div>
  );
}

export default App;
