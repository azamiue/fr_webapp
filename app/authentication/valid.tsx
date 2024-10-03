import { useEffect } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());


export function emailValid(email: string, setValue: any) {

  const { data, error, isLoading } = useSWR(`http://127.0.0.1:8000/auth/email/${email}`, fetcher)


}
