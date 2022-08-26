import firebaseAdmin from "config/firebase"

const getData = (
  snapshot: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>,
) => {
  try {
    return JSON.parse(snapshot.data()?.value)
  } catch (err) {
    return null
  }
}

export class AppFirestore {
  async get<T>(
    key: string,
    defaultValue: T | null = null,
    onChange?: (value: T) => any,
  ) {
    const dataRef = firebaseAdmin.firestore().collection("parsers").doc(key)

    dataRef.onSnapshot((snapshot) => {
      onChange && onChange((getData(snapshot) as T) ?? (defaultValue as T))
    })
  }

  async set<T>(key: string, value: T) {
    const dataRef = firebaseAdmin.firestore().collection("parsers").doc(key)
    await dataRef.set(value)
  }
}

export const appFirestore = new AppFirestore()
