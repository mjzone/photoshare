import React, { Component } from "react";
import { Form, Container, Grid, Card, Image } from "semantic-ui-react";
import { v4 as uuid } from "uuid";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

import { graphql, compose } from "react-apollo";
import { graphqlMutation } from "aws-appsync-react";
import { Auth } from "aws-amplify";

import { buildSubscription } from "aws-appsync";

import { createAlbum } from "../gql/mutations";
import { onCreateAlbum } from "../gql/subscriptions";
import { listAlbums } from "../gql/queries";

dayjs.extend(relativeTime);
class Album extends Component {
  state = { title: "" };

  componentDidMount() {
    this.props.data.subscribeToMore(buildSubscription(onCreateAlbum, listAlbums));
  }

  handleSubmit = async e => {
    e.preventDefault();
    const id = uuid();
    const { username: owner } = await Auth.currentUserInfo();
    const { title } = this.state;
    const createdAt = new Date().toISOString();

    this.props.createAlbum({
      input: {
        id,
        title,
        owner,
        createdAt
      }
    });
  };

  handleChange = (e, { value }) => {
    this.setState({ title: value });
  };

  handleAlbumClick = album => {
    this.props.history.push(`/album/${album.id}`);
  };

  render() {
    return (
      <React.Fragment>
        <fieldset>
          <Form onSubmit={this.handleSubmit}>
            <Form.Group>
              <Form.Input
                label="Album Title"
                type="text"
                placeholder="Album Title"
                value={this.state.title}
                onChange={this.handleChange}
              />
              <Form.Button icon labelPosition="right" label="Upload" type="submit" disabled={!this.state.title.length}>
                Create Album
              </Form.Button>
            </Form.Group>
          </Form>
        </fieldset>
        <Container>
          <Grid>
            <Card.Group itemsPerRow={4} style={{ marginTop: "25px" }}>
              {this.props.albums.map((album, index) => (
                <Card color="orange" key={index} onClick={() => this.handleAlbumClick(album)}>
                  <Image src="https://react.semantic-ui.com/images/wireframe/white-image.png" wrapped ui={false} />
                  <Card.Content>
                    <Card.Header>{album.title}</Card.Header>
                    <Card.Meta>
                      <span className="date"> {dayjs(album.createdOn).fromNow()}</span>
                    </Card.Meta>
                  </Card.Content>
                </Card>
              ))}
            </Card.Group>
          </Grid>
        </Container>
      </React.Fragment>
    );
  }
}

export default compose(
  graphqlMutation(createAlbum, listAlbums, "Album"),
  graphql(listAlbums, {
    options: {
      fetchPolicy: "cache-and-network"
    },
    props: props => ({
      albums: props.data.listAlbums ? props.data.listAlbums.items : [],
      data: props.data
    })
  })
)(Album);
