import {
  DashboardTableRequest,
  DashboardTableResponse,
} from "./dashboard.types";

export const fetchDashboardTable = async (
  body: DashboardTableRequest
): Promise<DashboardTableResponse> => {
  console.log('[API] Calling fetchDashboardTable with:', body);

  try {
    const response = await fetch("/api/dashboard/overview/companies", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    console.log('[API] Response received:', response.status, response.statusText);

    if (!response.ok) {
      throw new Error(`API 호출 실패: ${response.status}`);
    }

    const data = await response.json();
    console.log('[API] Data parsed successfully, rows:', data.rows?.length);

    return data;
  } catch (error) {
    console.error('[API] Fetch error:', error);
    throw error;
  }
};

