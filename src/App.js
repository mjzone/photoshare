import React, { Component } from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import "./App.css";
import "semantic-ui-css/semantic.min.css";

// Containers
import NavigationBar from "./containers/Navigation";
import Feed from "./containers/Feed";
import Album from "./containers/Album";
import AlbumPhotos from "./containers/AlbumPhotos";

//Amplify
import Amplify, { Auth } from "aws-amplify";
import { withAuthenticator } from "aws-amplify-react";
import config from "./aws-exports";

//AppSync and Apollo libraries
import AWSAppSyncClient from "aws-appsync";
import { Rehydrated } from "aws-appsync-react";
import { ApolloProvider } from "react-apollo";

// Amplify init
Amplify.configure(config);

const GRAPHQL_API_REGION = config.aws_appsync_region;
const GRAPHQL_API_ENDPOINT_URL = config.aws_appsync_graphqlEndpoint;
const AUTH_TYPE = config.aws_appsync_authenticationType;

// AppSync client instantiation
const client = new AWSAppSyncClient({
  url: GRAPHQL_API_ENDPOINT_URL,
  region: GRAPHQL_API_REGION,
  auth: {
    type: AUTH_TYPE,
    // Get the currently logged in users credential.
    jwtToken: async () => (await Auth.currentSession()).getAccessToken().getJwtToken()
  },
  // Amplify uses Amazon IAM to authorize calls to Amazon S3. This provides the relevant IAM credentials.
  complexObjectsCredentials: () => Auth.currentCredentials()
});

class App extends Component {
  render() {
    return (
      <Router>
        <Switch>
          <NavigationBar>
            <Route exact path="/" component={Feed} />
            <Route exact path="/albums" component={Album} />
            <Route exact path="/album/:id" component={AlbumPhotos} />
          </NavigationBar>
        </Switch>
      </Router>
    );
  }
}

const AppWithAuth = withAuthenticator(App, true);

export default () => (
  <ApolloProvider client={client}>
    <Rehydrated>
      <AppWithAuth />
    </Rehydrated>
  </ApolloProvider>
);
