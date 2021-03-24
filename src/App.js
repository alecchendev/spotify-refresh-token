import React from 'react';
import axios from 'axios';

function App() {

  const [ inputs, setInputs ] = React.useState({
    clientId: '',
    clientSecret: '',
    scope: '',
  });

  const [ scopes, setScopes ] = React.useState({
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

  const [ outputs, setOutputs ] = React.useState({
    filled: false,
    accessToken: '',
    refreshToken: 'asdfasd',
    data: {}
  });

  function getHashParams() {
    var hashParams = {};
    var e, r = /([^&;=]+)=?([^&;]*)/g,
        q = window.location.hash.substring(1);
    while ( e = r.exec(q)) {
       hashParams[e[1]] = decodeURIComponent(e[2]);
    }
    return hashParams;
  }

  React.useEffect(() => {

    const callApi = async (params) => {

      let data = {};
      try {

        const response = await axios({
          method: 'get',
          url: 'https://api.spotify.com/v1/me',
          headers: { 
            'Authorization': 'Bearer ' + params.access_token,
          },
          json: true
        });
        data = response.data;

      } catch (err) {
        console.log(err);
      }

      setOutputs({
        ...outputs,
        filled: true,
        accessToken: params.access_token,
        refreshToken: params.refresh_token,
        data
      });
    }
    
    const params = getHashParams();

    if (params.access_token && params.refresh_token) {
      callApi(params);
    }
  }, []);

  React.useEffect(() => {
    setInputs({
      ...inputs,
      scope: Object.keys(scopes).filter((scope) => scopes[scope]).join(' ')
    });
  }, [scopes]);

  const handleChange = (event) => {
    setInputs({
      ...inputs,
      [event.target.name]: event.target.value,
    });
  };

  const handleCheck = (event) => {
    const newScopes = {...scopes};
    newScopes[event.target.name] = !scopes[event.target.name];
    setScopes(newScopes);
  };

  const handleSelectAll = (event) => {
    const newScopes = {...scopes};
    for (let scope in newScopes) {
      newScopes[scope] = event.target.checked;
    }
    setScopes(newScopes);
  };

  const scopeElements = Object.keys(scopes).map((scope) => {
    return <div key={scope} style={{width: '250px', display: 'inline-block'}}>
      <input
        type='checkbox'
        name={scope}
        checked={scopes[scope]}
        onChange={handleCheck}
      />
      <label style={{width: '200px', marginLeft: '10px', fontWeight: 'normal'}}>{scope}</label>
    </div>
  })

  const queryString = window.location.href.split('/').slice(0, 3).join('/')
                      + "/login?clientId=" + inputs.clientId
                      + "&clientSecret=" + inputs.clientSecret
                      + "&scope=" + inputs.scope
                      + "&hostname=" + window.location.href.split('/').slice(0, 3).join('/');

  const repoLink = "https://github.com/alecchendev/spotify-refresh-token";

  return (
    <div id='container'>
      <h1>{window.location.hostname}</h1>
      <p>If this app helps you at all, feel free to star <a href={repoLink} rel="noreferrer" target='_blank'>my repo</a> so I can claim developer fame.</p>
      <p><strong>Remember to add {window.location.href.split('/').slice(0, 3).join('/') + '/callback'} as a redirect uri in your app.</strong></p>

      <div>
        <label>Client Id</label>
        <input
          type="text"
          name="clientId"
          value={inputs.clientId}
          onChange={handleChange}
        />

        <br/>

        <label>Client Secret</label>
        <input
          type="text"
          name="clientSecret"
          value={inputs.clientSecret}
          onChange={handleChange}
        />

        <br/>

        <label>Scope</label>
        <br/>

        {scopeElements}
        <div style={{width: '250px', display: 'inline-block'}}>
          <input
            type="checkbox"
            onChange={handleSelectAll}
          />
          <label style={{width: '200px', marginLeft: '10px', fontWeight: 'normal'}}>Select all</label>
        </div>

        <br/>

        <a style={{color: 'black'}} href={queryString}><button >Submit</button></a>
      </div>

      {outputs.filled && 
      <div>
        <h2>Results</h2>
        <div>
          <label>Access token: </label>
          <p>{outputs.accessToken}</p>
          <br/>
          <label>Refresh token: </label>
          <p>{outputs.refreshToken}</p>
          <br/>
          <label>Example API call</label>
          <p>{JSON.stringify(outputs.data)}</p>
        </div>
      </div>}
      

    </div>
  );
}

export default App;
