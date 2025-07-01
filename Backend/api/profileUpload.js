const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]){
            const formData = new FormData();
            formData.append('image',event.target.files[0]);
            formData.append('processCheckId', processCheckId);
            const response = await fetch('/api/upload-profile-image', {
                method: 'POST',
                body: formData
            });
            if (response.ok) {
                // handle success (refresh, toast, etc.)
            }
        }
};
