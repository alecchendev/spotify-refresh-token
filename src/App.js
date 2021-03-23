import React from 'react';

function App() {

  const [ inputs, setInputs ] = React.useState({
    clientId: '',
    clientSecret: '',
    scopes: '',
  });

  const [ outputs, setOutputs ] = React.useState({
    loading: false,
    filled: false,
    accessToken: '',
    refreshToken: 'asdfasd',
    data: {}
  });

  const handleChange = (event) => {
    console.log(event.target.name + ": " + event.target.value);
    setInputs({
      ...inputs,
      [event.target.name]: event.target.value,
    });
  }

  const handleSubmit = () => {
    setOutputs({
      ...outputs,
      loading: true
    })
    
    console.log('Confirmed submit.');
    setOutputs({
      ...outputs,
      loading: false,
      filled: !outputs.filled
    });
  }

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
        <label>Scopes</label>
        <input
          type="text"
          name="scopes"
          value={inputs.scopes}
          onChange={handleChange}
        />
        <br/>
        <button type="submit" onClick={handleSubmit}>Submit</button>
      </div>

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
