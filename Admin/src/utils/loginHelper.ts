/**
 * loginHelper.ts
 *
 * Call `onLoginSuccess(userData, tokens)` immediately after a successful
 * login API response to:
 *   1. Persist tokens + user to AsyncStorage
 *   2. Set roleName on the PermissionContext
 *   3. Fetch and load the full permission map for the new role
 *
 * Usage (in your Login screen):
 *
 *   import { usePermissions } from '../hooks/usePermissions';
 *   import { onLoginSuccess } from '../utils/loginHelper';
 *   import { useNavigation } from '@react-navigation/native';
 *
 *   const { loadPermissions, setCurrentRole } = usePermissions();
 *   const navigation = useNavigation<any>();
 *
 *   // Inside your login mutation onSuccess:
 *   await onLoginSuccess(responseData, { loadPermissions, setCurrentRole });
 *   navigation.replace('Main');
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

interface LoginResponseData {
    user: {
        id: string;
        name: string;
        email?: string | null;
        phone?: string | null;
        roleId: string;
        roleName?: string | null;
    };
    accessToken: string;
    refreshToken: string;
}

interface PermissionHooks {
    loadPermissions: () => Promise<void>;
    setCurrentRole: (role: string) => void;
}

export const onLoginSuccess = async (
    data: LoginResponseData,
    { loadPermissions, setCurrentRole }: PermissionHooks,
): Promise<void> => {
    // 1. Persist to AsyncStorage
    await AsyncStorage.multiSet([
        ['accessToken', data.accessToken],
        ['refreshToken', data.refreshToken],
        ['user', JSON.stringify(data.user)],
    ]);

    // 2. Set role name in context immediately (so sidebar label is correct)
    if (data.user.roleName) {
        setCurrentRole(data.user.roleName);
    }

    // 3. Fetch fresh permissions for this role from the API
    //    This populates the PermissionMap so all hasPermission() calls
    //    are correct the moment the user lands on Main.
    await loadPermissions();
};