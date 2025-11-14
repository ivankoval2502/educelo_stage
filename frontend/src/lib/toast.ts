import toast from 'react-hot-toast';

export const showSuccess = (message: string) => {
    toast.success(message, {
        style: {
            background: '#378134',
            color: '#ffffff',
            border: '1px solid #ffffff',
        }
    });
}

export const showError = (message: string) => {
    toast.error(message, {
        style: {
            background: '#813434',
            color: '#ffffff',
            border: '1px solid #ffffff',
        }
        }
    )
}

export const showInfo = (message:string)=> {
    toast(message, {
        icon: 'ℹ️',
        style: {
            background: '#817d34',
            color: '#ffffff',
            border: '1px solid #ffffff',
        }
    })
}

export const showLoading = (message: string) => {
    return toast.loading(message, {
        style: {
            background: '#7e7e7e',
            color: '#ffffff',
            border: '1px solid #ffffff',
        }
    })
}

export const dismissToast = (toastId: string) => {
    toast.dismiss(toastId)
}