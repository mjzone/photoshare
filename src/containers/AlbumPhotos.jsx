import React, { Component } from "react";
import { v4 as uuid } from "uuid";
import { graphql, compose } from "react-apollo";
import gql from "graphql-tag";
import { S3Image } from "aws-amplify-react";
import { Form, Icon, Table, Button, Loader, Container, Grid } from "semantic-ui-react";
import { Storage } from "aws-amplify";
import { Auth } from "aws-amplify";
import { createPicture } from "../graphql/mutations";
import { getAlbum } from "../graphql/queries";
import config from "../aws-exports";

export class AlbumPhotos extends Component {
  state = {
    name: "",
    file: undefined
  };

  handleSubmit = async e => {
    e.preventDefault();
    const visibility = "private";
    const bucket = config.aws_user_files_s3_bucket;
    const region = config.aws_user_files_s3_bucket_region;
    const id = uuid();
    const { name, file: selectedFile } = this.state;
    const { identityId } = await Auth.currentCredentials();
    const { username: owner } = await Auth.currentUserInfo();
    const createdAt = new Date().toISOString();
    const pictureAlbumId = this.props.match.params.id;

    let file;
    if (selectedFile) {
      const { name: fileName, type: mimeType } = selectedFile;
      const [, , , extension] = /([^.]+)(\.(\w+))?$/.exec(fileName);
      const key = `${visibility}/${identityId}/${uuid()}${extension && "."}${extension}`;

      file = {
        bucket,
        key,
        region,
        mimeType,
        localUri: selectedFile
      };
    }

    this.props.createPicture({
      id,
      name,
      owner,
      visibility,
      file,
      createdAt,
      pictureAlbumId
    });
  };

  handleDownload = async ({ visibility: level, file }) => {
    debugger;
    try {
      const { bucket, region, key } = file;
      const [, , keyWithoutPrefix] = /([^/]+\/){2}(.*)$/.exec(key) || key;

      const url = await Storage.get(keyWithoutPrefix, { bucket, region, level });

      window.open(url);
    } catch (err) {
      console.error(err);
    }
  };

  handleChange = (field, event) => {
    const {
      target: { value, files }
    } = event;
    const [file] = files || [];
    this.setState({ [field]: file || value });
  };

  render() {
    const isSubmitEnabled = this.state.name.length && !!this.state.file;
    return (
      <React.Fragment>
        <fieldset>
          <Form onSubmit={this.handleSubmit}>
            <Form.Group>
              <Form.Input
                label="Photo Title"
                type="text"
                placeholder="Photo Title"
                value={this.state.name}
                onChange={this.handleChange.bind(this, "name")}
              />
              <Form.Input
                key={this.state.lastUpdate}
                label="Select Photo"
                type="file"
                onChange={this.handleChange.bind(this, "file")}
              />
              <Form.Button icon labelPosition="right" label="Upload" type="submit" disabled={!isSubmitEnabled}>
                <Icon name="upload" />
                Upload Photo
              </Form.Button>
            </Form.Group>
          </Form>
        </fieldset>
        <Table celled={true}>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>
                <Icon name={"info"} />
                Title
              </Table.HeaderCell>
              <Table.HeaderCell>
                <Icon name={"user"} />
                Owner
              </Table.HeaderCell>
              <Table.HeaderCell>
                 <Icon name={"download"} />
                Download
              </Table.HeaderCell>
              <Table.HeaderCell>
                 <Icon name={"share"} />
                Share
              </Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {this.props.photos &&
              this.props.photos.items &&
              []
                .concat(this.props.photos.items)
                .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                .map(photo => (
                  <Table.Row key={photo.id}>
                    <Table.Cell>{photo.name}</Table.Cell>
                    <Table.Cell>{photo.owner}</Table.Cell>
                    <Table.Cell>
                      {photo.file ? (
                        <Button icon labelPosition="right" onClick={() => this.handleDownload(photo)}>
                          <Icon name="download" />
                          Download
                        </Button>
                      ) : (
                        <Loader inline="centered" active size="tiny" />
                      )}
                    </Table.Cell>
                    <Table.Cell>
                      {photo.file ? (
                        <Button icon labelPosition="right" onClick={() => this.handleDownload(photo)}>
                          <Icon name="eye" />
                          Share Public
                        </Button>
                      ) : (
                        <Loader inline="centered" active size="tiny" />
                      )}
                    </Table.Cell>
                  </Table.Row>
                ))}
          </Table.Body>
        </Table>
      </React.Fragment>
    );
  }
}

export default compose(
  graphql(gql(createPicture), {
    options: props => ({
      update: (proxy, { data: { createPicture } }) => {
        const query = gql(getAlbum);
        const variables = {
          id: props.match.params.id
        };
        const data = proxy.readQuery({ query, variables });
        data.getAlbum.pictures.items = [
          ...data.getAlbum.pictures.items.filter(photo => photo.id !== createPicture.id),
          createPicture
        ];
        proxy.writeQuery({ query, data });
      }
    }),
    props: props => ({
      createPicture: photo =>
        props.mutate({
          variables: { input: photo },
          optimisticResponse: () => ({
            createPicture: {
              ...photo,
              id: uuid(),
              __typename: "Picture",
              file: { ...photo.file, __typename: "S3Object" }
            }
          })
        })
    })
  }),
  graphql(gql(getAlbum), {
    options: props => ({
      fetchPolicy: "cache-and-network",
      variables: {
        id: props.match.params.id
      }
    }),
    props: props => ({
      photos: props.data.getAlbum ? props.data.getAlbum.pictures : []
    })
  })
)(AlbumPhotos);
