import React from 'react';
import axios from 'axios';
import { useParams } from "react-router";

function App() {

  const [ inputs, setInputs ] = React.useState({
    clientId: '',
    clientSecret: '',
    scope: '',
  });

  const [ outputs, setOutputs ] = React.useState({
    loading: false,
    filled: false,
    accessToken: '',
    refreshToken: 'asdfasd',
    data: {}
  });

  // const [ params, setParams ] = React.useState({});
  const params = useParams();

  const handleChange = (event) => {
    console.log(event.target.name + ": " + event.target.value);
    setInputs({
      ...inputs,
      [event.target.name]: event.target.value,
    });
  }

  const handleSubmit = async () => {
    setOutputs({
      ...outputs,
      loading: true
    })
    console.log('Confirmed submit.');
    const response = await axios({
      method: 'get',
      url: '/login',
      params: {
        ...inputs
      }
    });
    setOutputs({
      ...outputs,
      loading: false,
      filled: !outputs.filled
    });
  }

  const queryString = "/login?clientId=" + inputs.clientId + "&clientSecret=" + inputs.clientSecret + "&scope=" + inputs.scope;

  return (
    <div id='container'>
      <h1>www.getyourspotifyrefreshtoken.com</h1>
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
        <a href={queryString}><button >Log In</button></a>
        <button type="submit" onClick={handleSubmit}>Submit</button>
      </div>

      <h4>{JSON.stringify(params)}</h4>

      {outputs.loading &&
      <h2>Loading...</h2>}

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
