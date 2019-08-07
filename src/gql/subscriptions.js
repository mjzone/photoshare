import gql from "graphql-tag";

export const onUpdatePicture = gql`
  subscription OnUpdatePicture {
    onUpdatePicture {
      id
      name
      owner
      visibility
      file {
        bucket
        region
        key
      }
      createdAt
    }
  }
`;

export const onCreateAlbum = gql`
  subscription OnCreateAlbum {
    onCreateAlbum {
      id
      title
      owner
      createdAt
      pictures {
        items {
          id
          name
          owner
          visibility
          createdAt
        }
        nextToken
      }
    }
  }
`;
