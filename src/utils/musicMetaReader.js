// src/utils/musicMetaReader.js
import jsmediatags from "jsmediatags";

export const getMetadata = (src) => {
  return new Promise((resolve) => {
    new jsmediatags.Reader(src)
      .setTagsToRead(["title", "artist"])
      .read({
        onSuccess: (tag) => {
          const { title, artist } = tag.tags;
          resolve({ title, artist });
        },
        onError: () => {
          resolve({ title: null, artist: null });
        },
      });
  });
};