import React from 'react';
import axios from 'axios';

function App() {

  const [ inputs, setInputs ] = React.useState({
    clientId: '',
    clientSecret: '',
    scope: '',
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

  React.useEffect(async () => {
    
    const params = getHashParams();

    let data = {};

    if (params.access_token && params.refresh_token) {

      try {

        const response = await axios({
          method: 'get',
          url: 'https://api.spotify.com/v1/me',
          headers: { 
            'Authorization': 'Bearer ' + params.access_token,
          },
          json: true
        });
        console.log(response);
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
  }, []);

  const handleChange = (event) => {
    console.log(event.target.name + ": " + event.target.value);
    setInputs({
      ...inputs,
      [event.target.name]: event.target.value,
    });
  }

  const queryString = "http://localhost:8888/login?clientId=" + inputs.clientId
                      + "&clientSecret=" + inputs.clientSecret
                      + "&scope=" + inputs.scope
                      + "&hostname=" + window.location.href;

  const repoLink = "https://github.com/alecchendev/spotify-refresh-token";

  return (
    <div id='container'>
      <h1>{window.location.hostname}</h1>
      <p>If this app helps you at all, feel free to star my repository so I can claim developer fame.</p>
      <p>Repo: <a href={repoLink}>{repoLink}</a></p>
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
        <input
          type="text"
          name="scope"
          value={inputs.scope}
          onChange={handleChange}
        />
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
