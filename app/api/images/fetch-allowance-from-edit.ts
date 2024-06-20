const tipAllowanceApiUrl = "https://www.degentip.me/api/get_allowance";

export interface AllowanceFromEdit {
  tip_allowance: number;
  remaining_allowance: number;
  avatar_url: string;
  display_name: string;
  fname: string;
  user_rank: number;
  fid: number;
  snapshot_date: string;
}

interface Response {
  allowance?: AllowanceFromEdit;
  Error: string;
}

export async function fetchAllowanceFromEdit(
  fid: number
): Promise<AllowanceFromEdit | null> {
  try {
    const res: Response = await fetch(`${tipAllowanceApiUrl}?fid=${fid}`).then(
      (res) => res.json()
    );
    if (res.Error) {
      return null;
    }
    return res.allowance ?? null;
  } catch (e) {
    console.error("Error fetching allowance from edit: ", e);
    return null;
  }
}
