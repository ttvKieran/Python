#include <dos.h>
#include <memory.h>
#include <stdlib.h>
#include <string.h>
#include <stdio.h>

struct BOOT {  // Cau truc boot cho FAT16
    char jmp[3];
    char OEM[8];
    int bytes_per_sector;
    char sectors_per_cluster;
    int reserved;
    char FAT_cnt;
    int ROOT_size;
    int total_sectors;
    char media;
    int FAT_size;
    int sectors_per_track;
    int head_cnt;
    long hidden_sectors;
    long total_sectors_long;
    char unknown[3];
    long serial;
    char volume[11];
    char FAT_type[8];
    char loader[448];
    char mark[2];
};

struct ROOT {  // Cau truc thong tin cua tep trong ROOT
    char name[8];
    char ext[3];
    char attr;
    char reserved[10];
    char time[2];
    char date[2];
    int first_cluster;
    long size;
};

int main() {
    int drive = 3;  // A=0, B=1, C=2, D=3 (o D)

    // Doc boot sector tu o dia
    BOOT boot;
    int res = absread(drive, 1, 0, &boot);
    if(res != 0){
        printf("Khong the doc boot sector\n");
        return 1;
    }

    // Doc bang FAT
    unsigned int *fat = (unsigned int *)malloc (boot.FAT_size * boot.bytes_per_sector);
    if (fat == NULL) {
        printf("Khong du bo nho\n");
        return 1;
    }

    res = absread(drive, boot.FAT_size, boot.reserved, fat);
    if(res != 0){
        printf("Khong the doc FAT\n");
        free(fat);
        return 1;
    }

    // Doc vung ROOT
    int num_byte = boot.ROOT_size * 32;  // kich thuoc cua ROOT (32 byte cho moi muc)
    ROOT *root = (ROOT *)malloc(num_byte);
    if(root == NULL) return 1;

    int num_sector = num_byte / boot.bytes_per_sector;
    int root_begin = boot.reserved + boot.FAT_size * boot.FAT_cnt;

    res = absread(drive, num_sector, root_begin, (void *)root);
    if(res != 0){
        printf("Khong the doc ROOT\n");
        free(root);
        free(fat);
        return 1;
    }

    // Nhap ten file tu ban phim voi do dai tuy y
    char filename[9];  // 8 ky tu cho ten file + 1 ky tu null
    printf("Nhap ten file (khong co phan mo rong): ");
    scanf("%8s", filename);

    // Them khoang trang neu ten file khong du 8 ky tu
    int len = strlen(filename);
    if (len < 8) {
        for (int i = len; i < 8; i++) {
            filename[i] = ' ';  // Them khoang trang vao cuoi
        }
        filename[8] = '\0';  // Ket thuc chuoi
    }

    // Tim file trong vung ROOT
    int i, k;
    char str[9];
    int first_cluster = -1;
    for(i = 0; i < boot.ROOT_size; i++){
        // Sao chep root[i].name sang str va them ky tu null de tao chuoi
        for(k = 0; k < 8 && root[i].name[k] != ' '; k++)
            str[k] = root[i].name[k];
        str[k] = 0;

        // So sanh ten file
        if(strncmp(root[i].name, filename, 8) == 0){
            first_cluster = root[i].first_cluster;
            break;
        }
    }

    // In ra cac cluster cua file neu tim thay
    if(first_cluster >= 0){
        printf("Cac cluster thuoc ve file %s: ", filename);
        unsigned int cur = first_cluster;
        while(cur < 0xFFF8){
            printf("%u ", cur);
            cur = fat[cur];
        }
        printf("\n");
    } else {
        printf("Khong tim thay file %s\n", filename);
    }

    // Giai phong bo nho
    free(root);
    free(fat);

    return 0;
}

