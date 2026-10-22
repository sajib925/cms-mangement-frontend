import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { IWebflowSiteInfo, WebflowApiResponse } from "@/types";

const rawBaseUrl =
  import.meta.env.VITE_DATA_CLIENT_URL ??
  "http://localhost:3000/api/v1";

const normalizedBaseUrl = rawBaseUrl.replace(/\/+$/, "");

export const dataApi = createApi({
  reducerPath: "dataApi",
  baseQuery: fetchBaseQuery({ baseUrl: normalizedBaseUrl }),
  tagTypes: ["Site", "Collection", "CollectionItem"],
  endpoints: (builder) => ({
    // ==========================================
    // 1. SITE & AUTH ENDPOINTS
    // ==========================================
    getRegisteredSiteInfo: builder.query<IWebflowSiteInfo, string>({
      query: (siteId) => `/webflow/site/${siteId}`,
      providesTags: ["Site"],
    }),

    validateWebflowSite: builder.mutation<WebflowApiResponse<unknown>, string>({
      query: (siteId) => ({
        url: `/webflow/validate?siteId=${encodeURIComponent(siteId)}`,
        method: "GET",
      }),
    }),

    getAuthenticatedUser: builder.query<WebflowApiResponse<unknown>, string>({
      query: (siteId) => `/webflow/user/${siteId}`,
      providesTags: ["Site"],
    }),

    getSiteFromApi: builder.query<WebflowApiResponse<unknown>, string>({
      query: (siteId) => `/webflow/sites/${siteId}/api-site`,
      providesTags: ["Site"],
    }),

    getSitesListFromApi: builder.query<WebflowApiResponse<unknown>, string>({
      query: (siteId) => `/webflow/sites/${siteId}/api-list`,
      providesTags: ["Site"],
    }),

    // ==========================================
    // 2. CMS COLLECTIONS ENDPOINTS
    // ==========================================
    listCollections: builder.query<WebflowApiResponse<unknown>, string>({
      query: (siteId) => `/cms/sites/${siteId}/collections`,
      providesTags: ["Collection"],
    }),

    getCollectionDetails: builder.query<
      WebflowApiResponse<unknown>,
      { siteId: string; collectionId: string }
    >({
      query: ({ siteId, collectionId }) =>
        `/cms/sites/${siteId}/collections/${collectionId}`,
      providesTags: ["Collection"],
    }),

    createCollection: builder.mutation<
      WebflowApiResponse<unknown>,
      { siteId: string; body: unknown }
    >({
      query: ({ siteId, body }) => ({
        url: `/cms/sites/${siteId}/collections`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Collection"],
    }),

    updateCollection: builder.mutation<
      WebflowApiResponse<unknown>,
      { siteId: string; collectionId: string; body: unknown }
    >({
      query: ({ siteId, collectionId, body }) => ({
        url: `/cms/sites/${siteId}/collections/${collectionId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Collection"],
    }),

    deleteCollection: builder.mutation<
      WebflowApiResponse<unknown>,
      { siteId: string; collectionId: string }
    >({
      query: ({ siteId, collectionId }) => ({
        url: `/cms/sites/${siteId}/collections/${collectionId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Collection"],
    }),

    // ==========================================
    // 3. CMS FIELDS ENDPOINTS
    // ==========================================
    createField: builder.mutation<
      WebflowApiResponse<unknown>,
      { siteId: string; collectionId: string; body: unknown }
    >({
      query: ({ siteId, collectionId, body }) => ({
        url: `/cms/sites/${siteId}/collections/${collectionId}/fields`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Collection"],
    }),

    updateField: builder.mutation<
      WebflowApiResponse<unknown>,
      { siteId: string; collectionId: string; fieldId: string; body: unknown }
    >({
      query: ({ siteId, collectionId, fieldId, body }) => ({
        url: `/cms/sites/${siteId}/collections/${collectionId}/fields/${fieldId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Collection"],
    }),

    deleteField: builder.mutation<
      WebflowApiResponse<unknown>,
      { siteId: string; collectionId: string; fieldId: string }
    >({
      query: ({ siteId, collectionId, fieldId }) => ({
        url: `/cms/sites/${siteId}/collections/${collectionId}/fields/${fieldId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Collection"],
    }),

    // ==========================================
    // 4. CMS ITEMS (STAGING) ENDPOINTS
    // ==========================================
    listItems: builder.query<
      WebflowApiResponse<unknown>,
      {
        siteId: string;
        collectionId: string;
        offset?: number;
        limit?: number;
        translatable?: string;
      }
    >({
      query: ({ siteId, collectionId, offset, limit, translatable }) => {
        const params = new URLSearchParams();
        if (offset !== undefined) params.append("offset", offset.toString());
        if (limit !== undefined) params.append("limit", limit.toString());
        if (translatable) params.append("translatable", translatable);

        const queryString = params.toString();
        return `/cms-items/sites/${siteId}/collections/${collectionId}/items${
          queryString ? `?${queryString}` : ""
        }`;
      },
      providesTags: ["CollectionItem"],
    }),

    getItem: builder.query<
      WebflowApiResponse<unknown>,
      {
        siteId: string;
        collectionId: string;
        itemId: string;
        translatable?: string;
      }
    >({
      query: ({ siteId, collectionId, itemId, translatable }) => {
        const params = new URLSearchParams();
        if (translatable) params.append("translatable", translatable);

        const queryString = params.toString();
        return `/cms-items/sites/${siteId}/collections/${collectionId}/items/${itemId}${
          queryString ? `?${queryString}` : ""
        }`;
      },
      providesTags: ["CollectionItem"],
    }),

    insertItems: builder.mutation<
      WebflowApiResponse<unknown>,
      { siteId: string; collectionId: string; body: unknown }
    >({
      query: ({ siteId, collectionId, body }) => ({
        url: `/cms-items/sites/${siteId}/collections/${collectionId}/items/insert`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["CollectionItem"],
    }),

    updateItems: builder.mutation<
      WebflowApiResponse<unknown>,
      { siteId: string; collectionId: string; body: unknown }
    >({
      query: ({ siteId, collectionId, body }) => ({
        url: `/cms-items/sites/${siteId}/collections/${collectionId}/items`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["CollectionItem"],
    }),

    deleteItems: builder.mutation<
      WebflowApiResponse<unknown>,
      { siteId: string; collectionId: string; body: unknown }
    >({
      query: ({ siteId, collectionId, body }) => ({
        url: `/cms-items/sites/${siteId}/collections/${collectionId}/items`,
        method: "DELETE",
        body,
      }),
      invalidatesTags: ["CollectionItem"],
    }),

    publishItems: builder.mutation<
      WebflowApiResponse<unknown>,
      { siteId: string; collectionId: string; body: unknown }
    >({
      query: ({ siteId, collectionId, body }) => ({
        url: `/cms-items/sites/${siteId}/collections/${collectionId}/items/publish`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["CollectionItem"],
    }),

    // ==========================================
    // 5. CMS ITEMS (LIVE) ENDPOINTS
    // ==========================================
    listItemsLive: builder.query<
      WebflowApiResponse<unknown>,
      {
        siteId: string;
        collectionId: string;
        offset?: number;
        limit?: number;
        translatable?: string;
      }
    >({
      query: ({ siteId, collectionId, offset, limit, translatable }) => {
        const params = new URLSearchParams();
        if (offset !== undefined) params.append("offset", offset.toString());
        if (limit !== undefined) params.append("limit", limit.toString());
        if (translatable) params.append("translatable", translatable);

        const queryString = params.toString();
        return `/cms-items/sites/${siteId}/collections/${collectionId}/items/live${
          queryString ? `?${queryString}` : ""
        }`;
      },
      providesTags: ["CollectionItem"],
    }),

    getItemLive: builder.query<
      WebflowApiResponse<unknown>,
      {
        siteId: string;
        collectionId: string;
        itemId: string;
        translatable?: string;
      }
    >({
      query: ({ siteId, collectionId, itemId, translatable }) => {
        const params = new URLSearchParams();
        if (translatable) params.append("translatable", translatable);

        const queryString = params.toString();
        return `/cms-items/sites/${siteId}/collections/${collectionId}/items/${itemId}/live${
          queryString ? `?${queryString}` : ""
        }`;
      },
      providesTags: ["CollectionItem"],
    }),

    createItemLive: builder.mutation<
      WebflowApiResponse<unknown>,
      { siteId: string; collectionId: string; body: unknown }
    >({
      query: ({ siteId, collectionId, body }) => ({
        url: `/cms-items/sites/${siteId}/collections/${collectionId}/items/live`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["CollectionItem"],
    }),

    updateItemsLive: builder.mutation<
      WebflowApiResponse<unknown>,
      { siteId: string; collectionId: string; body: unknown }
    >({
      query: ({ siteId, collectionId, body }) => ({
        url: `/cms-items/sites/${siteId}/collections/${collectionId}/items/live`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["CollectionItem"],
    }),

    deleteItemsLive: builder.mutation<
      WebflowApiResponse<unknown>,
      { siteId: string; collectionId: string; body: unknown }
    >({
      query: ({ siteId, collectionId, body }) => ({
        url: `/cms-items/sites/${siteId}/collections/${collectionId}/items/live`,
        method: "DELETE",
        body,
      }),
      invalidatesTags: ["CollectionItem"],
    }),
  }),
});

export const {
  // Site Hooks
  useGetRegisteredSiteInfoQuery,
  useValidateWebflowSiteMutation,
  useGetAuthenticatedUserQuery,
  useLazyGetAuthenticatedUserQuery,
  useGetSiteFromApiQuery,
  useGetSitesListFromApiQuery,

  // Collection Hooks
  useListCollectionsQuery,
  useGetCollectionDetailsQuery,
  useCreateCollectionMutation,
  useUpdateCollectionMutation,
  useDeleteCollectionMutation,

  // Field Hooks
  useCreateFieldMutation,
  useUpdateFieldMutation,
  useDeleteFieldMutation,

  // Staging Item Hooks
  useListItemsQuery,
  useLazyListItemsQuery,
  useGetItemQuery,
  useInsertItemsMutation,
  useUpdateItemsMutation,
  useDeleteItemsMutation,
  usePublishItemsMutation,

  // Live Item Hooks
  useListItemsLiveQuery,
  useGetItemLiveQuery,
  useCreateItemLiveMutation,
  useUpdateItemsLiveMutation,
  useDeleteItemsLiveMutation,
} = dataApi;