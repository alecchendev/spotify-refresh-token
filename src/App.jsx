import React, { useState, useEffect } from 'react';
import QueryString from 'query-string';
import axios from 'axios';

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
const generateRandomString = (length) => {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

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
      Authorization: `Basic ${new Buffer(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
  },
);

function App() {
  const [inputs, setInputs] = useState({
    clientId: '',
    clientSecret: '',
    scope: '',
  });

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

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('code');
    if (token) {
      setRefreshToken(token);
    }
    console.log(`Got refresh token: ${token}`);
  }, []);

  useEffect(() => {
    if (refreshToken.length > 0) {
      getAccessToken(refreshToken, inputs.clientId, inputs.clientSecret).then((response) => {
        setAccessToken(response.data.access_token);
      }).catch((error) => {
        console.error(error);
      });
    }
  }, [refreshToken]);

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

  useEffect(() => {
    setInputs({
      ...inputs,
      scope: Object.keys(scopes).filter((scope) => scopes[scope]).join(' '),
    });
  }, [scopes]);

  /**
   * Handles the client id/secret change
   * @param {React.MouseEventHandler<HTMLInputElement>} event
   */
  const handleChange = (event) => {
    setInputs({
      ...inputs,
      [event.target.name]: event.target.value,
    });
  };

  /**
   * Handles the scope checkbox change
   * @param {string} name
   */
  const handleCheck = (name) => {
    const newScopes = { ...scopes };
    newScopes[name] = !scopes[name];
    setScopes(newScopes);
  };

  // sets the "select all" checkbox to true if all scopes are selected
  const allSelected = Object.keys(scopes).every((scope) => scopes[scope]);

  /**
   * handles the "select all" checkbox change
   * @param {boolean} selectAll
   */
  const handleSelectAll = (selectAll) => {
    const newScopes = Object.keys(scopes).reduce((acc, scope) => {
      acc[scope] = selectAll;
      return acc;
    }, {});

    setScopes(newScopes);
  };

  const queryString = `https://accounts.spotify.com/authorize?response_type=code&client_id=${inputs.clientId}&scope=${encodeURIComponent(inputs.scope)}&redirect_uri=${encodeURIComponent(window.location.href.split('/').slice(0, 3).join('/').concat('/callback'))}&state=${generateRandomString(16)}`;

  console.log(queryString);

  return (
    <div className="flex h-screen text-white m-5">
      <div className="m-auto xl:w-1/2 grid grid-cols-1 gap-3">
        <div className="flex-1 text-4xl bg-slate-700 rounded-xl p-5 text-center underline">
          Get your spotify refresh token!
        </div>

        <div className="flex-1 bg-slate-700 rounded-xl p-5 text-center">
          Remember to add
          {` ${window.location.href.split('/').slice(0, 3).join('/')}/callback `}
          as a redirect uri in your app.
        </div>

        <div className="bg-slate-700 rounded-xl p-5 text-center grid grid-cols-1 gap-3">
          <div className="grid grid-cols-1 gap-2">
            <div className="bg-gray-600 rounded-xl p-3 text-center flex">
              <div className="flex-1">Client Id</div>
              <input
                className="flex-initial bg-slate-300 text-black p-1"
                type="text"
                name="clientId"
                value={inputs.clientId}
                onChange={handleChange}
              />
            </div>
            <div className="bg-gray-600 rounded-xl p-3 text-center flex">
              <div className="flex-1">Client Secret</div>
              <input
                className="flex-initial bg-slate-300 text-black p-1"
                type="text"
                name="clientSecret"
                value={inputs.clientSecret}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="text-3xl underline m-3">
            Scope
          </div>
          <div className="grid gap-2 xl:grid-cols-2">
            {Object.keys(scopes).map((scope) => (
              <button type="button" key={scope} className="p-2 flex bg-slate-600 cursor-pointer" onClick={() => handleCheck(scope)}>
                <input
                  type="checkbox"
                  className="flex-initial cursor-pointer"
                  id={scope}
                  onChange={() => {}}
                  checked={scopes[scope]}
                />
                <div className="flex-1 cursor-pointer">{scope}</div>
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
        </div>

        <button type="submit" className="bg-slate-600 p-2 rounded-xl mb-5" onClick={() => window.location.replace(queryString)}>
          Submit
        </button>

        {outputs.filled
      && (
      <div>
        <h2>Results</h2>
        <div>
          <div>Access token: </div>
          <p>{outputs.accessToken}</p>
          <br />
          <div>Refresh token: </div>
          <p>{outputs.refreshToken}</p>
          <br />
          <div>Example API call</div>
          <p>{JSON.stringify(outputs.data)}</p>
        </div>
      </div>
      )}

      </div>

    </div>
  );
}

export default App;
