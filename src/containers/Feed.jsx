import React, { Component } from "react";
import { buildSubscription } from "aws-appsync";
import { onUpdatePicture } from "../gql/subscriptions";
import { listPictures } from "../gql/queries";
import { graphql, compose } from "react-apollo";

class Feed extends Component {
  componentDidMount() {
    this.props.data.subscribeToMore(buildSubscription(onUpdatePicture, listPictures));
  }
  render() {
    return (
      <div>
        {this.props.photos.map((photo, index) => (
          <p key={photo.id}>{photo.name}</p>
        ))}
      </div>
    );
  }
}

export default compose(
  graphql(listPictures, {
    options: props => ({
      fetchPolicy: "cache-and-network"
    }),
    props: props => ({
      data: props.data,
      photos: props.data.listPictures ? props.data.listPictures.items : []
    })
  })
)(Feed);
