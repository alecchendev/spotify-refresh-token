import React, { useState, useEffect } from 'react';
import axios from 'axios';

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
  });

  const [outputs, setOutputs] = useState({
    filled: false,
    accessToken: '',
    refreshToken: 'asdfasd',
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

  const handleChange = (event) => {
    setInputs({
      ...inputs,
      [event.target.name]: event.target.value,
    });
  };

  const handleCheck = (name) => {
    const newScopes = { ...scopes };
    newScopes[name] = !scopes[name];
    setScopes(newScopes);
  };

  const allSelected = Object.keys(scopes).every((scope) => scopes[scope]);

  const handleSelectAll = (selectAll) => {
    const newScopes = Object.keys(scopes).reduce((acc, scope) => {
      acc[scope] = selectAll;
      return acc;
    }, {});

    setScopes(newScopes);
  };

  const queryString = `${window.location.href.split('/').slice(0, 3).join('/')}
  /login?clientId=${inputs.clientId}
  &clientSecret=${inputs.clientSecret}
  &scope=${inputs.scope}
  &hostname=${window.location.href.split('/').slice(0, 3).join('/')}`;

  return (
    <div className="flex h-screen text-white">
      <div className="m-auto md:w-1/2 grid grid-cols-1 gap-3">
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

          <div className="text-2xl underline">
            Scope
          </div>
          <div className="grid gap-2 xl:grid-cols-2">
            {Object.keys(scopes).map((scope) => (
              <button type="button" key={scope} className="p-2 flex bg-slate-600 cursor-pointer" onClick={() => handleCheck(scope)}>
                <input
                  type="checkbox"
                  className="flex-initial cursor-pointer"
                  id={scope}
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
              checked={allSelected}
            />
            <div className="flex-1 cursor-pointer">Select all</div>
          </button>

          <button type="submit" onClick={() => window.location.replace(queryString)}>
            Submit
          </button>
        </div>

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
