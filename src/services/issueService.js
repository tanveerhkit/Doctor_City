import csrfManager from "../utils/csrfManager";
import { buildApiUrl } from "../config/api";

const parseResponse = async (response) => {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.error ||
        data.message ||
        data.errors?.[0]?.msg ||
        `Request failed with status ${response.status}`
    );
  }

  return data;
};

const buildQueryString = (params = {}) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, value);
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
};

export const fetchIssues = async (params = {}) => {
  const response = await csrfManager.secureFetch(
    `${buildApiUrl("/api/issues")}${buildQueryString(params)}`
  );
  return parseResponse(response);
};

export const fetchIssueById = async (issueId) => {
  const response = await csrfManager.secureFetch(buildApiUrl(`/api/issues/${issueId}`));
  return parseResponse(response);
};

export const createIssue = async (payload) => {
  const response = await csrfManager.secureFetch(buildApiUrl("/api/issues"), {
    method: "POST",
    body: payload,
  });
  return parseResponse(response);
};

export const updateIssueStatus = async (issueId, newStatus, note = "") => {
  const response = await csrfManager.secureFetch(
    buildApiUrl(`/api/issues/${issueId}/status`),
    {
      method: "PATCH",
      body: JSON.stringify({ newStatus, note }),
    }
  );
  return parseResponse(response);
};

export const toggleIssueVote = async (issueId) => {
  const response = await csrfManager.secureFetch(
    buildApiUrl(`/api/issues/${issueId}/vote`),
    {
      method: "POST",
      body: JSON.stringify({}),
    }
  );
  return parseResponse(response);
};

export const updateIssue = async (issueId, payload) => {
  const response = await csrfManager.secureFetch(
    buildApiUrl(`/api/issues/${issueId}`),
    {
      method: "PATCH",
      body: payload,
    }
  );
  return parseResponse(response);
};

export const deleteIssue = async (issueId) => {
  const response = await csrfManager.secureFetch(
    buildApiUrl(`/api/issues/${issueId}`),
    {
      method: "DELETE",
    }
  );
  return parseResponse(response);
};
