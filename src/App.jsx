import React, { useState, useEffect, useRef } from 'react';
import QueryString from 'query-string';
import axios from 'axios';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { useSearchParams } from 'react-router-dom';
import Checkbox from './components/Checkbox';
import InputBox from './components/InputBox';

const allScopes = [
  'ugc-image-upload',
  'user-read-recently-played',
  'user-top-read',
  'user-read-playback-position',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'app-remote-control',
  'playlist-modify-public',
  'playlist-modify-private',
  'playlist-read-private',
  'playlist-read-collaborative',
  'user-follow-modify',
  'user-follow-read',
  'user-library-modify',
  'user-library-read',
  'user-read-email',
  'user-read-private',
  'streaming',
];

const allScopesAlias = 'all';

// Get the callback uri to give to spotify
let callbackUri = window.location.href.split('/').slice(0, 4).join('/');

// if the callback uri ends with a slash, remove it
callbackUri = callbackUri.endsWith('/') ? callbackUri.slice(0, callbackUri.length - 1) : callbackUri;

const App = () => {
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');

  const [refreshToken, setRefreshToken] = useState('');
  const [accessToken, setAccessToken] = useState('');

  const [saveRefreshToken, setSaveRefreshToken] = useState(false);
  const [saveClientCredentials, setSaveClientCredentials] = useState(false);

  const [outputs, setOutputs] = useState({
    filled: false,
    data: {},
  });

  // get code and scopes from url query params
  const [searchParams, setSearchParams] = useSearchParams();

  const code = searchParams.get('code');
  const scopes = searchParams.getAll('scope');

  /**
   * Set one or more scopes as URL search params in the format `scope=<name>`
   *
   * @param {string[]} newScopes
   */
  const setScopes = (...newScopes) => {
    if (newScopes.length && allScopes.every((s) => newScopes.includes(s))) {
      setSearchParams((params) => {
        params.set('scope', allScopesAlias);
        return params;
      });
    } else {
      setSearchParams((params) => {
        params.delete('scope');
        newScopes.forEach((s) => params.append('scope', s));
        return params;
      });
    }
  };

  /**
   * Check if a scope is present as a URL search param
   *
   * @param {string} scope
   */
  const hasScope = (scope) => scopes.includes(scope);

  // sets the "select all" checkbox to true if all scopes are selected
  const allSelected = hasScope(allScopesAlias);

  /**
   * Gets the access token from the API
   *
   * @returns {Promise<Object>} The response from the API containing the access token
   */
  const getTokens = () => axios.post(
    'https://accounts.spotify.com/api/token',
    QueryString.stringify({
      code,
      redirect_uri: callbackUri,
      grant_type: 'authorization_code',
    }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${new Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
    },
  );

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

    const clientIdStored = localStorage.getItem('clientId') || sessionStorage.getItem('clientId');
    if (clientIdStored) {
      setClientId(clientIdStored);
    }
    const clientSecretStored = localStorage.getItem('clientSecret') || sessionStorage.getItem('clientSecret');
    if (clientSecretStored) {
      setClientSecret(clientSecretStored);
    }
    const refreshTokenStored = localStorage.getItem('refreshToken');
    if (refreshTokenStored) {
      setRefreshToken(refreshTokenStored);
    }

    const sessionScopes = sessionStorage.getItem('scope');
    if (sessionScopes) {
      setScopes(...JSON.parse(sessionScopes));
    }

    sessionStorage.clear();
  }, []);

  /**
   * Gets the access token if the refresh token is set
   */
  useEffect(() => {
    if (code?.length > 0 && clientId.length > 0 && clientSecret.length > 0) {
      getTokens().then((response) => {
        setAccessToken(response.data.access_token);
        setRefreshToken(response.data.refresh_token);
        setSearchParams((params) => {
          params.delete('code');
          return searchParams;
        });
      }).catch((error) => {
        console.error(error);
      });
    }
  }, [clientId, clientSecret]);

  /**
   * Gets the data from the Spotify API if the access token is set
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
   * Add or remove the refresh token from local storage
   */
  useEffect(() => {
    if (saveRefreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    } else {
      localStorage.removeItem('refreshToken');
    }
  }, [saveRefreshToken, refreshToken]);

  /**
   * Add or remove client credentials from local storage
   */
  useEffect(() => {
    if (saveClientCredentials) {
      localStorage.setItem('clientId', clientId);
      localStorage.setItem('clientSecret', clientSecret);
    } else {
      localStorage.removeItem('clientId');
      localStorage.removeItem('clientSecret');
    }
  }, [saveClientCredentials, clientId, clientSecret]);

  /**
   * Handles the scope checkbox change
   * @param {string} name
   */
  const handleCheck = (name) => {
    if (hasScope(name)) {
      return setScopes(...scopes.filter((s) => s !== name));
    }

    if (allSelected) {
      return setScopes(...allScopes.filter((s) => s !== name));
    }

    return setScopes(...scopes, name);
  };

  /**
   * handles the "select all" checkbox change
   */
  const handleSelectAll = () => (allSelected ? setScopes() : setScopes(...allScopes));

  /**
   * Handles the submit button click, which will redirect the user to the Spotify login page
   */
  const handleSubmit = () => {
    sessionStorage.setItem('clientId', clientId);
    sessionStorage.setItem('clientSecret', clientSecret);

    const selectedScopes = allSelected ? allScopes : scopes;
    sessionStorage.setItem('scope', JSON.stringify(selectedScopes));

    /** we include the clientId and the clientSecret in the
     *  redirect uri to avoid having to store them in the browser */
    const scope = selectedScopes.join(' ');
    const queryString = `https://accounts.spotify.com/authorize?response_type=code&client_id=${clientId}&scope=${encodeURIComponent(scope)}&redirect_uri=${callbackUri}`;
    window.location.replace(queryString);
  };

  return (
    <div className="flex h-screen text-white m-5">
      <div className="m-auto md:w-2/3 max-w-[1024px] grid grid-cols-1 gap-3">
        <div className="flex-1 text-4xl bg-slate-700 rounded-xl p-5 text-center underline">
          Get your spotify refresh token!
        </div>
        <div className="flex-1 bg-slate-700 rounded-xl p-5 text-base text-center no-underline">
          If this app helps you at all, feel free to star
          {' '}
          <a href="https://github.com/alecchendev/spotify-refresh-token" target="_blank" rel="noreferrer" className="underline">the repo</a>
          !
          Special thanks to
          {' '}
          <a href="https://github.com/Acorn221" target="_blank" rel="noreferrer" className="underline">James Arnott</a>
          {' '}
          for contributing to this project.

        </div>
        <div className="flex-1 text-xl bg-red-500 rounded-xl p-5 text-center underline">
          Warning, this is not a secure way to get your refresh token! Do not use this with your production keys!
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
          <div className="grid grid-cols-2 gap-2">
            <InputBox label="Client ID" value={clientId} onChange={setClientId} />
            <InputBox label="Client Secret" value={clientSecret} onChange={setClientSecret} />
          </div>

          <div className="text-3xl underline m-3">
            Scope
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            {allScopes.map((s) => (
              <Checkbox checked={hasScope(s) || allSelected} onClick={() => handleCheck(s)} label={s} key={s} />
            ))}
          </div>

          <Checkbox checked={allSelected} onClick={handleSelectAll} label="Select all" />

          <div className="text-3xl underline m-3">
            Save credentials
          </div>
          <div className="grid grid-cols-2 gap-2 select-none">
            <Checkbox checked={saveClientCredentials} onClick={() => setSaveClientCredentials(!saveClientCredentials)} label="Save Client Id/Secret" />
            <Checkbox checked={saveRefreshToken} onClick={() => setSaveRefreshToken(!saveRefreshToken)} label="Save Refresh Token" />
          </div>
        </div>

        <button type="submit" className="bg-slate-700 hover:bg-slate-600 p-2 rounded-xl mb-5" onClick={handleSubmit}>
          Submit
        </button>

      </div>

    </div>
  );
};

export default App;
